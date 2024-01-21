import http from '@/utils/request'

export default {
    async getDepartmentList(param) {
        return await http.get("/api/department/list", param);
    },
    async getParentTreeList(){
        return await http.get("/api/department/parent/list")
    },
    async addDept(params){
        return await http.post("/api/department/add",params)
    },
    async updateDept(params){
        return await http.put("/api/department/update",params)
    },
    async checkDepartment(params){
        return await http.getRestApi("/api/department/check",params);
    },
    async deleteById(params){
        return await http.delete("/api/department/delete",params);
    },
}