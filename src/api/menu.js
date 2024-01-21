import http from "@/utils/request"

export default{
    async getMenuList(params){
        return await http.get("/api/permission/list",params);
    },
    async getParentMenuList(params){
        return await http.get("/api/permission/parent/list",params);
    },
    async add(params){
        return await http.post("/api/permission/add",params);
    },
    async update(params){
        return await http.put("/api/permission/update",params);
    },
    async check(params){
        return await http.getRestApi("/api/permission/check",params);
    },
    async deletById(params){
        return await http.delete("/api/permission/delete",params);
    }
}