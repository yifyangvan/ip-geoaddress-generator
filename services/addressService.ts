import type { Address, Coordinates } from "@/app/types";
import axios from "axios";

type CoordinatesResponse = Coordinates;
type AddressResponse = {
  address: Address;
};

class AddressService {
  async getIPCoordinates(ip: string): Promise<CoordinatesResponse> {
    const response = await axios.get<CoordinatesResponse>(
      `https://ipapi.co/${ip}/json/`
    );
    return response.data;
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

    // 定义axios配置，添加user-agent头
    const axiosConfig = {
      headers: {
        'User-Agent': 'IP-Geoaddress-Generator/1.0 (https://github.com/GuooGaii/ip-geoaddress-generator)'
      }
    };

    let attempts = 0;
    const maxAttempts = 3;
    let address: Address | null = null;

    while (attempts < maxAttempts && !address) {
      attempts++;
      // 生成随机偏移范围，根据尝试次数逐渐扩大
        const range = attempts === 1 ? 1 : attempts === 2 ? 5 : 15;
        const randomCoords = generateRandomOffset(coordinates.latitude, coordinates.longitude, range);
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${randomCoords.latitude}&lon=${randomCoords.longitude}&format=json&accept-language=en&addressdetails=1`;
        
        try {
          const response = await axios.get<AddressResponse>(url, axiosConfig);
          
          // 检查响应是否有效
          if (response.data && response.data.address) {
            const addr = response.data.address;
            // 检查是否找到有效的住宅区地址（有门牌号或详细街道信息）
            const isResidential = addr.house_number || (addr.road && addr.city);
            
            if (isResidential) {
              address = addr;
            }
          }
        } catch (_apiError) {
          // 忽略单次API调用错误，继续尝试
          console.log(`第${attempts}次尝试获取地址失败，继续尝试`);
        }
    }
    
    if (!address) {
      throw new Error(`尝试${maxAttempts}次后仍未找到有效地址`);
    }
    
    return address;
  }

  async getCoordinates(
    country: string,
    state: string,
    city: string
  ): Promise<Coordinates> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${city},${state},${country}&format=json&limit=1`;
      // 添加user-agent头
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'IP-Geoaddress-Generator/1.0 (https://github.com/GuooGaii/ip-geoaddress-generator)'
        }
      });
      const { lat, lon } = response.data[0];
      return { latitude: lat, longitude: lon };
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `获取地理坐标失败(${city}, ${state}, ${country}):`,
          error.message
        );
      }
      throw error;
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
