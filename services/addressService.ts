import type { Address, Coordinates } from "@/app/types";
import axios from "axios";

type CoordinatesResponse = Coordinates;
type AddressResponse = {
  address: Address;
};

class AddressService {
  async getIPCoordinates(ip: string): Promise<CoordinatesResponse> {
    try {
      const response = await axios.get<CoordinatesResponse>(
        `https://ipapi.co/${ip}/json/`
      );
      // 确保返回的数据包含有效坐标
      if (!response.data || typeof response.data.latitude !== 'number' || typeof response.data.longitude !== 'number') {
        throw new Error('获取的IP坐标数据无效');
      }
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`获取IP(${ip})坐标失败:`, error.message);
        throw new Error(`获取IP坐标失败: ${error.message}`);
      }
      throw new Error('获取IP坐标失败，未知错误');
    }
  }

  async getRandomAddress(coordinates: Coordinates): Promise<Address> {
    // 生成随机偏移（1-2公里范围内）
    const generateRandomOffset = (baseLat: number, baseLon: number, range: number = 1) => {
      // 1度约等于111公里
      const latOffset = (Math.random() - 0.5) * (range * 0.018); // 转换为度
      const lonOffset = (Math.random() - 0.5) * (range * 0.018);
      return {
        latitude: baseLat + latOffset,
        longitude: baseLon + lonOffset,
      };
    };

    let attempts = 0;
    const maxAttempts = 3;
    let address: Address | null = null;
    let lastError: Error | null = null;

    while (attempts < maxAttempts && !address) {
      attempts++;
      try {
        // 生成随机偏移范围，根据尝试次数逐渐扩大
        const range = attempts === 1 ? 1 : attempts === 2 ? 5 : 15;
        // 确保坐标是数值类型
        const lat = parseFloat(coordinates.latitude.toString());
        const lon = parseFloat(coordinates.longitude.toString());
        
        // 验证坐标有效性
        if (isNaN(lat) || isNaN(lon)) {
          throw new Error('无效的坐标值');
        }
        
        const randomCoords = generateRandomOffset(lat, lon, range);
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${randomCoords.latitude}&lon=${randomCoords.longitude}&format=json&accept-language=en&addressdetails=1`;
        
        const response = await axios.get<AddressResponse>(url, {
          timeout: 5000, // 设置5秒超时
        });
        
        // 检查响应是否有效
        if (response.status === 200 && response.data && response.data.address) {
          const addr = response.data.address;
          // 检查是否找到有效的住宅区地址（有门牌号或详细街道信息）
          const isResidential = addr.house_number || (addr.road && addr.city && addr.country);
          
          if (isResidential) {
            address = addr;
          } else {
            console.log(`第${attempts}次尝试获取地址失败：未找到有效的住宅区地址`);
          }
        } else {
          console.log(`第${attempts}次尝试获取地址失败：API返回无效响应`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误');
        console.log(`第${attempts}次尝试获取地址失败：${lastError.message}，继续尝试`);
      }
    }
    
    if (!address) {
      const errorMessage = lastError 
        ? `尝试${maxAttempts}次后仍未找到有效地址，最后一次错误：${lastError.message}`
        : `尝试${maxAttempts}次后仍未找到有效地址`;
      throw new Error(errorMessage);
    }
    
    return address;
  }

  async getCoordinates(
    country: string,
    state: string,
    city: string
  ): Promise<Coordinates> {
    try {
      // 验证输入参数
      if (!country || !state || !city) {
        throw new Error('国家、州和城市参数不能为空');
      }
      
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)},${encodeURIComponent(state)},${encodeURIComponent(country)}&format=json&limit=1`;
      const response = await axios.get(url, {
        timeout: 5000, // 设置5秒超时
      });
      
      // 检查响应数据
      if (!response.data || response.data.length === 0) {
        throw new Error(`未找到匹配的坐标：${city}, ${state}, ${country}`);
      }
      
      const { lat, lon } = response.data[0];
      
      // 验证返回的坐标数据
      if (!lat || !lon) {
        throw new Error(`返回的坐标数据无效：${city}, ${state}, ${country}`);
      }
      
      // 确保返回的是数字类型
      const latitude = parseFloat(lat.toString());
      const longitude = parseFloat(lon.toString());
      
      // 验证坐标数值有效性
      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error(`返回的坐标数值无效：${city}, ${state}, ${country}`);
      }
      
      return { 
        latitude, 
        longitude 
      };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : '未知错误';
      console.error(
        `获取地理坐标失败(${city}, ${state}, ${country}):`,
        errorMessage
      );
      throw new Error(`获取地理坐标失败：${errorMessage}`);
    }
  }

  getGoogleMapUrl(address: Address): string {
    const addressString = [
      address.house_number,
      address.road,
      address.city,
      address.state,
      address.country,
    ]
      .filter(Boolean)
      .join(", ");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      addressString
    )}`;
  }
}

export const addressService = new AddressService();
