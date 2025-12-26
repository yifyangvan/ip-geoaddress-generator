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

    // 首先尝试1-2公里范围内查找
    let randomCoords = generateRandomOffset(coordinates.latitude, coordinates.longitude, 1);
    let url = `https://nominatim.openstreetmap.org/reverse?lat=${randomCoords.latitude}&lon=${randomCoords.longitude}&format=json&accept-language=en`;
    let response = await axios.get<AddressResponse>(url);
    let address = response.data.address;
    
    // 检查是否找到有效的住宅区地址（有门牌号或详细街道信息）
    const isResidential = address.house_number || (address.road && address.city);
    
    // 如果没有找到有效的住宅区地址，扩大到10-20公里范围搜索
    if (!isResidential) {
      console.log("1-2公里范围内未找到住宅区，扩大搜索范围到10-20公里");
      randomCoords = generateRandomOffset(coordinates.latitude, coordinates.longitude, 15); // 10-20公里范围内的随机偏移
      url = `https://nominatim.openstreetmap.org/reverse?lat=${randomCoords.latitude}&lon=${randomCoords.longitude}&format=json&accept-language=en`;
      response = await axios.get<AddressResponse>(url);
      address = response.data.address;
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
      const response = await axios.get(url);
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
