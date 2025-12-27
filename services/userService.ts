import type { User } from "@/app/types";
import { generatePhoneNumber } from "./phoneService";

class UserService {
  async fetchUser(country: string): Promise<User> {
    // 生成随机用户名
    const firstNames = ["John", "Jane", "Bob", "Alice", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // 生成随机ID
    const randomId = Math.floor(Math.random() * 1000000).toString();
    
    // 使用phoneService生成匹配国家的电话号码
    const phoneNumber = generatePhoneNumber(country);
    
    // 返回生成的用户信息
    return {
      name: {
        first: randomFirstName,
        last: randomLastName
      },
      phone: phoneNumber,
      id: {
        name: "",
        value: randomId
      }
    };
  }
}

export const userService = new UserService();
