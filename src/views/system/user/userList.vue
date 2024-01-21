<template>
    <el-container :style="{height:containerHeight+'px'}">
        <el-aside
            style="padding:10px 0px 0px 0px;
                    background:#fff;
                    border-right:1px solid #dfe6ec;
                    "
            width="200px"
        >
            <!--expand-on-click-node设置为false,取消点击节点展开或隐藏,此功能使用expanded属性交由自己控制,并设置点击节点时的事件
                    并且将复选框取消--->
            <el-tree
                style="font-size:14px"
                ref="leftTree"
                :data="deptList"
                node-key="id"
                :props="defaultProps"
                default-expand-all
                empty-text="暂无数据"
                :show-checkbox="false"
                :highlight-current="true"
                :expand-on-click-node="false"
                @node-click="handleNodeClick"
            >
                <div class="custom-tree-node" slot-scope="{node,data}">
                    <div>
                        <span v-if="data.children.length==0">
                            <i class="el-icon-document"></i>
                        </span>
                        <!--click.stop是阻止父节点事件的冒泡,当点击加减号时,阻止handleNodeClick事件-->
                        <span v-else @click.stop="openBtn(data)">
                            <svg-icon v-if="data.open" icon-class="add-s"/>
                            <svg-icon v-else icon-class="sub-s"/>
                        </span>
                        <span style="margin-left:3px">{{node.label}}</span>
                    </div>
                </div>
            </el-tree>
        </el-aside>
        <!--表格数据-->
        <el-main>
            <el-form
                :model="searchModel"
                ref="searchForm"
                label-width="80px"
                :inline="true"
                size="samll"
            >
                <el-form-item>
                    <el-input v-model="searchModel.username" placeholder="请输入用户名"/>
                </el-form-item>
                <el-form-item>
                    <el-input v-model="searchModel.realname" placeholder="请输入真实姓名"/>
                </el-form-item>
                <el-form-item>
                    <el-input v-model="searchModel.phone" placeholder="请输入电话"/>
                </el-form-item>
                <el-form-item>
                    <el-button icon="el-icon-search" type="primary"
                                    @click="search(departmentId,pageNo,pageSize)">查询</el-button>
                    <el-button icon="el-icon-delete" @click="resetValue()">重置</el-button>
                    <el-button icon="el-icon-plus" size="small" type="success" 
                                    @click="openAddWindow()" v-if="hasPermission('sys:user:add')">新增</el-button>
                </el-form-item>
            </el-form>
            <!--用户表格数据-->
            <el-table
                :height="tableHeight"
                :data="userList"
                border
                strip
                style="width: 100%; margin-bottom: 10px"
            >
            <el-table-column prop="username" label="用户名"></el-table-column>
            <el-table-column prop="realName" label="真实姓名"></el-table-column>
            <el-table-column prop="departmentName" label="所属部门"></el-table-column>
            <el-table-column prop="phone" label="电话"></el-table-column>
            <el-table-column prop="email" label="邮箱"></el-table-column>
            <el-table-column align="center" width="290" label="操作">
                <template slot-scope="scope">
                    <el-button icon="el-icon-eidt" type="primary"
                                size="mini" @click="handleEdit(scope.row)" 
                                v-if="hasPermission('sys:user:edit')">编辑</el-button>
                    <el-button icon="el-icon-delete" type="danger"
                                size="mini" @click="handleDelete(scope.row)"
                                v-if="hasPermission('sys:user:delete')">删除</el-button>
                    <el-button icon="el-icon-setting" type="primary"
                                size="mini" @click="assignRole(scope.row)"
                                v-if="hasPermission('sys:user:assign')">分配角色</el-button>
                </template>
            </el-table-column>
            </el-table>
            <!--分页工具栏-->
            <el-pagination
                background
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :current-page="pageNo"
                :page-sizes="[10,20,30,40,50]"
                :page-size="10"
                layout="total,sizes,prev,pager,next,jumper"
                :total="total"
            >
            </el-pagination>
            <system-dialog
                :title="userDialog.title"
                :visible="userDialog.visible"
                :width="userDialog.width"
                :height="userDialog.height"
                @onClose="onClose"
                @onConfirm="onConfirm"
            >
                <div slot="content">
                    <el-form
                        :model="user"
                        ref="userForm"
                        :rules="rules"
                        label-width="80px"
                        :inline="true"
                        size="small"
                    >
                        <el-form-item label="用户名" prop="username">
                            <el-input v-model="user.username"></el-input>
                        </el-form-item>
                        <el-form-item label="密码" v-if="user.id===''" prop="password">
                            <el-input type="password" v-model="user.password"></el-input>
                        </el-form-item>
                        <el-form-item label="所属部门" prop="departmentName">
                            <el-input v-model="user.departmentName" :readonly="true"
                                        @click.native="selectDepartment()"></el-input>
                        </el-form-item>
                        <el-form-item label="姓名" prop="realName">
                            <el-input v-model="user.realName"></el-input>
                        </el-form-item>
                        <el-form-item label="电话" prop="phone">
                            <el-input v-model="user.phone"></el-input>
                        </el-form-item>
                        <el-form-item label="昵称">
                            <el-input v-model="user.nickName"></el-input>
                        </el-form-item>
                        <el-form-item label="邮箱">
                            <el-input v-model="user.email"></el-input>
                        </el-form-item>
                        <el-form-item label="性别" prop="gender">
                            <el-radio-group v-model="user.gender">
                                <el-radio :label="0">男</el-radio>
                                <el-radio :label="1">女</el-radio>
                            </el-radio-group>
                        </el-form-item>
                        <el-form-item label="头像">
                            <!--data属性为额外携带的数据,在这里就是token.两个钩子函数:文件上传成功和文件上传之前-->
                            <el-upload
                                :show-file-list="false"
                                :on-success="handleAvatarSuccess"
                                :before-upload="beforeAvatarUpload"
                                class="avatar-uploader"
                                :data="uploadHeader"
                                action="http://localhost:8888/api/oss/file/upload?module=avatar"
                            >
                            <img v-if="user.avatar" :scr="user.avatar">
                            <i v-else class="el-icon-plus avatar-uploader-icon"/>
                            </el-upload>
                        </el-form-item>
                    </el-form>
                </div>
            </system-dialog>
            <!--部门树选择窗口-->
            <system-dialog
                :title="parentDialog.title"
                :visible="parentDialog.visible"
                :width="parentDialog.width"
                :height="parentDialog.height"
                @onClose="onParentClose"
                @onConfirm="onParentConfirm"
            >
                <div slot="content"><!--content是框架里自带的,有dialog时就设置这个值-->
                    <el-tree
                        ref="parentTree"
                        :data="parentList"
                        node-key="id"
                        :props="parentProps"
                        :default-expand-all="true"
                        :highlight-current="true"
                        :expand-on-click-node="false"
                        @node-click="parentClick"
                    >   <!--node是针对单个节点的数据,data是整个数据源-->
                        <div class="customr-tree-node" slot-scope="{ node, data }">
                            <span v-if="data.children.length === 0">
                                <i class="el-icon-document"></i>
                            </span>
                            <span v-else @click.stop="openParentBtn(data)">
                                <svg-icon v-if="data.open" icon-class="add-s"></svg-icon>
                                <svg-icon v-else icon-class="sub-s" ></svg-icon>
                            </span>
                            <span style="margin-left: 3px">{{ node.label }}</span>
                        </div>
                    </el-tree>
                </div>
            </system-dialog>
            <!--分配角色窗口-->
            <system-dialog
                :title="assignDialog.title"
                :visible="assignDialog.visible"
                :width="assignDialog.width"
                :height="assignDialog.height"
                @onClose="onAssignClose"
                @onConfirm="onAssignConfirm"
            >
                <div slot="content">
                    <!--分配角色的数据表格-->
                    <el-table 
                        ref="assignRoleTable"
                        :data="assignRoleList"
                        border
                        stripe
                        :height="assignHeight"
                        style="width:100%;margin-bottom:10px;"
                        @selection-change="handleSelectionChange"
                    >
                        <el-table-column
                            type="selection"
                            width="55"
                            align="center"
                        ></el-table-column>
                        <el-table-column prop="roleCode" label="角色编码"/>
                        <el-table-column prop="roleName" label="角色名称"/>
                        <el-table-column prop="remark" label="角色备注"/>
                    </el-table>
                    <el-pagination
                        background
                        @size-change="assignSizeChange"
                        @current-change="assignCurrentChange"
                        :current-page.sync="roleVo.pageNo"
                        :page-sizes="[10,20,30,40,50]"
                        :page-size="roleVo.pageSize"
                        layout="total,sizes,prev,pager,next,jumper"
                        :total="roleVo.total"
                    >
                    </el-pagination>
                </div>
            </system-dialog>
        </el-main>
    </el-container>
</template>

<script>
import departmentApi from "@/api/department";
import userApi from "@/api/user"
import SystemDialog from "@/components/system/SystemDialog.vue";
import {getToken} from '@/utils/auth'


export default {
    name:"UserList",
    components: { SystemDialog },
    data(){
            //手机号正则验证规则
            let validatePhone = (rule,value,callback) =>{
                if(!value){
                    callback(new Error("请输入手机号码"));
                }else if(!/^1[3456789]\d{9}$/.test(value)){
                    callback(new Error("手机号格式不正确"));
                }else{
                    callback();
                }
            };
        return {
            //查询条件
            searchModel:{
                username:"",
                realname:"",
                phone:"",
                departmentId:"",
                pageNo:1,
                pageSize:10,
            },
            userList:[],//用户列表
            tableHeight:0,//表格高度
            pageNo:1,//当前页码
            pageSize:10,//每页显示数量
            total:0,//总数量
            departmentId:"",//部门编号
            containerHeight:0,//容器高度
            deptList:[],//左侧部门树形菜单
            defaultProps:{
                children:"children",
                label:"departmentName",
            },
            //用户对象
            user:{
                id:"",
                departmentId:"",
                departmentName:"",
                email:"",
                realName:"",
                phone:"",
                password:"",
                username:"",
                gender:"",
                avatar:"",
            },
            //添加和修改用户窗口属性
            userDialog:{
                title:"",
                visible:false,
                height:410,
                width:610
            },
            rules:{
                departmentName:[{required : true,trigger:"change",message:"请选择所属部门"}],
                realName:[{required : true,trigger:"blur",message:"请填写姓名"}],
                phone:[{required : true,trigger:"blur",validator: validatePhone}],
                username:[{required : true,trigger:"blur",message:"请填写登录名"}],
                password:[{required : true,trigger:"blur",message:"请输入密码"}],
                gender:[{required : true,trigger:"change",message:"请选择性别"}],
            },
            //部门树窗口属性
            parentDialog:{
                title:"选择所属部门",
                visible:false,
                width:300,
                height:450,
            },
            //树节点属性
            parentProps:{
                children:"children",
                label:"departmentName",
            },
            //所属部门节点数据
            parentList:[],
            //上传需要携带的数据
            uploadHeader:{"token":getToken()},
            //分配角色窗口属性
            assignDialog:{
                title:"",
                visible:false,
                width:800,
                height:400,
            },
            //角色对象
            roleVo:{
                pageNo:1,
                pageSize:10,
                userId:"",
                total:0
            },
            assignRoleList:[],//角色列表
            assignHeight:0,//分配角色表格高度
            selectedIds:[],//被选中的角色ID
            selectedUserId:"",//被分配角色的用户ID
        }
    },
    methods:{
        //查询部门列表
        async getDeptList(){
            let res=await departmentApi.getDepartmentList(null);
            console.log(res)
            if(res.success){
            this.deptList=res.data;
            //树加载完成后,默认点击第一个节点
            this.$nextTick(()=>{
                const firstnode=document.querySelector(".el-tree-node");
                //document.querySelector是一个css选择器,选择第一个符合括号内规则的元素,el-tree-node是一个el-tree内部每个节点的class名称
                firstnode.click();
            })
            }
        },
        //搜索
        async search(departmentId,pageNo=1,pageSize=10){
            this.searchModel.departmentId=departmentId;
            this.searchModel.pageNo=pageNo;
            this.searchModel.pageSize=pageSize;
            //发送查询请求
            let res=await userApi.getUserList(this.searchModel);
            console.log(res)
            if(res.success){
                this.userList=res.data.records;
                this.total=res.data.total;
            }
        },
        //每页数量发生变化时触发该事件
        handleSizeChange(size){
            this.pageSize=size;
            this.search(this.departmentId,this.pageNo,size);
        },
        //当页码发生变化时触发时发生该事件
        handleCurrentChange(page){
            this.pageNo=page;
            this.search(this.departmentId,page,this.pageSize);
        },
        //重置
        resetValue(){
            this.searchModel={};
            this.search(this.departmentId);
        },
        //左侧树节点点击事件(点击部门就将其id作为like子句作查询)
        handleNodeClick(data){
            this.departmentId=data.id
            this.search(this.departmentId);
        },
        //加减号点击
        openBtn(data){
            data.open=!data.open
            this.$refs.leftTree.store.nodesMap[data.id].expanded=!data.open;
        },
        //打开新增和修改窗口
        openAddWindow(){
            this.$resetForm("userForm",this.user);//清空表单数据
            this.userDialog.visible=true;
            this.userDialog.title="新增角色"
        },
        //编辑用户事件
        handleEdit(row){
            //数据回显(row的数据复制到this.user)
            this.$objCopy(row,this.user);
            this.userDialog.visible=true;
            this.userDialog.title="编辑用户";
        },
        //删除用户事件
        async handleDelete(row){
            let confirm=await this.$myconfirm("确定要删除改用户吗");
            if(confirm){
                let res=await userApi.deleteUser({id:row.id})
                if(res.success){
                    this.$message.success(res.message);
                    //刷新
                    this.search(this.departmentId,this.pageNo,this.pageSize)
                }else{
                    this.message.error(res.message);
                }
            }
        },
        //窗口确认
        onConfirm(){
            this.$refs.userForm.validate(async(valid)=>{
                if(valid){
                    let res=null;
                    if(this.user.id===""){
                        //新增用户
                        res=await userApi.addUserApi(this.user);
                    }else{
                        //编辑修改用户
                        res=await userApi.updateUser(this.user);
                    }
                    if(res.success){
                        this.$message.success(res.message);
                        this.search(this.departmentId,this.pageNo,this.pageSize);
                        this.userDialog.visible=false;
                    }else{
                        this.$message.error(res.message);
                    }
                }
            })
        },
        //关闭窗口
        onClose(){
            this.userDialog.visible=false;
        },
        //选择部门树
        async selectDepartment(){
            let res= await departmentApi.getDepartmentList(null);
            if(res.success){
                this.parentList=res.data
            }
            this.parentDialog.visible=true;
        },
        //选择部门窗口确认
        onParentConfirm(){
            this.parentDialog.visible=false;
        },
        //选择部门窗口取消事件
        onParentClose(){
            this.parentDialog.visible=false;
        },
        //点击选择部门树节点事件
        parentClick(data){
            this.user.departmentId=data.id;
            this.user.departmentName=data.departmentName;
        },
        //选择部门树加减号图标点击事件
        openParentBtn(data){
            data.open=!data.open;
            this.$refs.parentTree.store.nodesMap[data.id].expanded=!data.open;
        },
        //上传成功回调
        handleAvatarSuccess(res, file) {
            this.user.avatar = res.data
            // 强制重新渲染
            this.$forceUpdate()
        },
        //上传校验
        beforeAvatarUpload(file) {
            const isJPG = file.type === 'image/jpeg'
            const isLt2M = file.size / 1024 / 1024 < 2
            if (!isJPG) {
                this.$message.error('上传头像图片只能是 JPG 格式!')
            }
            if (!isLt2M) {
                this.$message.error('上传头像图片大小不能超过 2MB!')
            }
            return isJPG && isLt2M
        },
        //点击分配角色按钮
        async assignRole(row){
            //防止角色出现问题
            this.selectedIds=[];
            this.selectedUserId="";
            //被分配的用户id
            this.selectedUserId=row.id
            //显示窗口
            this.assignDialog.visible=true;
            //设置标题
            this.assignDialog.title=`给【${row.realName}】分配角色`
            //查询当前登录用户的所有角色信息(超级管理员可操作全部角色,其他用户只能操作自己创建的角色)
            await this.getAssignRoleList();//await:异步操作完成后再继续执行
            let params={
                userId:row.id
            };
            let res=await userApi.getRoleIdByUserId(params);
            //如果存在数据
            if(res.success && res.data){
                //将查询到的角色ID列表交给选中角色列表
                this.selectedIds=res.data;
                //循环遍历
                this.selectedIds.forEach((key)=>{
                    this.assignRoleList.forEach((item)=>{
                        if(item.id===key){
                            //将被分配角色的用户的角色列表和登录用户可操作的角色列表作交集(inner join),勾选上
                            this.$refs.assignRoleTable.toggleRowSelection(item,true)
                        }
                    })
                })
            }
        },
        //查询当前登录用户的所有角色信息
        async getAssignRoleList(pageNo=1,pageSize=10){
            //给用户ID赋值
            this.roleVo.userId=this.$store.getters.userId;
            this.roleVo.pageNo=pageNo
            this.roleVo.pageSize=pageSize
            //发送查询请求
            let res=await userApi.getAssignRoleList(this.roleVo);
            console.log(res.data)
            if(res.success){
                this.assignRoleList=res.data.records;
                this.roleVo.total=res.data.total;
            }
        },
        //分配角色窗口确认
        async onAssignConfirm(){
            //判断用户是否有选中角色
            if(this.selectedIds.length===0){
                this.$message.warning("请选择要分配的角色");
                return;
            }
            let params={
                userId:this.selectedUserId,
                roleIds:this.selectedIds
            };
            let res=await userApi.assignRoleUser(params);
            console.log(res)
            if(res.success){
                this.$message.success(res.message);
                this.assignDialog.visible=false;
            }else{
                this.$message.error(res.message);
            }
        },
        //分配角色窗口关闭
        onAssignClose(){
            this.assignDialog.visible=false;
        },
        //分配角色窗口每页数量变化事件
        assignSizeChange(size){
            this.roleVo.size=size;
            this.getAssignRoleList(this.roleVo.pageNo,size);
        },
        //分配角色窗口页码变化事件
        assignCurrentChange(page){
            this.roleVo.pageNo=page;
            this.getAssignRoleList(page,this.roleVo.pageSize);
        },
        //当点击多选框时触发该事件
        handleSelectionChange(rows){
            let roleIds=[];
            for(let j=0;j<rows.length;j++){
                roleIds.push(rows[j].id)
            }
            //将选中的角色ID交给全局变量
            this.selectedIds=roleIds;
        },
    },
    created(){
            //查询部门列表
            this.getDeptList();
            //查询用户列表
            this.search(this.departmentId);
        },
        mounted(){
            this.$nextTick(()=>{
                //内容高度
                this.containerHeight=window.innerHeight-85;
                //表格高度
                this.tableHeight=window.innerHeight-220;
                //角色表格高度
                this.assignHeight=window.innerHeight-350;
            })
        }
}
</script>

<style lang="scss">
//用户头像
.avatar-uploader .el-upload {
border: 1px dashed #d9d9d9 !important;
border-radius: 6px;
cursor: pointer;
position: relative;
overflow: hidden;
}
.avatar-uploader .el-upload:hover {
border-color: #409EFF;
}
.avatar-uploader .avatar-uploader-icon {
font-size: 28px;
color: #8c939d;
width: 178px;
height: 178px;
line-height: 178px;
text-align: center;
}
.avatar-uploader img {
width: 178px;
height: 178px;
display: block;
}
</style>