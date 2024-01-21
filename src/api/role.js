import request from '@/utils/request'
import http from '@/utils/request'

export function getRoutes() {
  return request({
    url: '/vue-element-admin/routes',
    method: 'get'
  })
}

export function getRoles() {
  return request({
    url: '/vue-element-admin/roles',
    method: 'get'
  })
}

export function addRole(data) {
  return request({
    url: '/vue-element-admin/role',
    method: 'post',
    data
  })
}

export function updateRole(id, data) {
  return request({
    url: `/vue-element-admin/role/${id}`,
    method: 'put',
    data
  })
}

export function deleteRole(id) {
  return request({
    url: `/vue-element-admin/role/${id}`,
    method: 'delete'
  })
}

export default{
  async getRoleListApi(params){
    return await http.get("/api/role/list",params);
  },
  async addRoleApi(params){
    return await http.post("/api/role/add",params);
  },
  async updateRoleApi(params){
    return await http.put("/api/role/update",params);
  },
  async getAssignTreeAPi(params){
    return await http.get("/api/role/getAssignPermissionTree",params);
  },
  async assignSaveApi(params){
    return await http.post("/api/role/saveRoleAssign",params);
  },
  async checkHaveUserApi(params){
    return await http.getRestApi("/api/role/check",params);
  },
  async deleteRoleApi(params){
    return await http.delete("/api/role/delete",params);
  },
}
