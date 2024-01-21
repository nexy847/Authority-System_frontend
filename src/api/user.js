import http from '@/utils/request'

/**
 * 用户登录方法
 * @param 
 * @returns 
 */
export async function login(data) {
  return await http.login("/api/user/login",data)
}

/**
 * 获取用户信息和权限信息
 * @param  
 * @returns 
 */
export async function getInfo() {
  return await http.get("/api/sysUser/getInfo")
}

/**
 * 退出登录
 * @returns 
 */
export async function logout(param) {//param是外部数据(通过http对象从服务器端获取或发送的数据)
  return await http.post("/api/sysUser/logout",param);
}

export async function getMenuList(){
  return await http.get("/api/sysUser/getMenuList")
}

/**
* 刷新token
* @returns
*/
export async function refreshTokenApi(params){
  return await http.post("/api/sysUser/refreshToken",params);
}

export default {
  async getUserList(params){
    return await http.get("/api/user/list",params);
  },
  async addUserApi(params){
    return await http.post("/api/user/add",params);
  },
  async updateUser(params){
    return await http.put("/api/user/update",params);
  },
  async deleteUser(params){
    return await http.delete("/api/user/delete",params);
  },
  async getAssignRoleList(params){
    return await http.get("/api/user/getRoleListForAssign",params);
  },
  async getRoleIdByUserId(params){
    return await http.getRestApi("/api/user/getRoleByUserId",params);
  },
  async assignRoleUser(params){
    return await http.post("/api/user/saveUserRole",params);
  }
}