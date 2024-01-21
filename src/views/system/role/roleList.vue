<template>
  <el-main>
    <el-form
      :model="searchModel"
      ref="searchForm"
      label-width="80px"
      :inline="true"
      size="small"
    >
      <el-form-item>
        <el-input
          v-model="searchModel.roleName"
          placeholder="请输入角色名称"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search"
                    @click="search(pageNo,pageSize)">查询</el-button>
        <el-button icon="el-icon-refresh-right" @click="resetValue">重置</el-button>
        <el-button type="danger" icon="el-icon-plus" @click="openAddWindow" 
            v-if="hasPermission('sys:role:add')">新增</el-button>
      </el-form-item>
    </el-form>
    <!--数据表格-->
    <el-table
        :data="roleList"
        :height="tableHeight"
        border
        stripe
        style="width:100%;margin-bottom:10px"
    >
        <el-table-column
            prop="id"
            label="角色编号"
            width="100"
            align="center"
        ></el-table-column>
        <el-table-column prop="roleName" label="角色名称"></el-table-column>
        <el-table-column prop="remark" label="角色备注"></el-table-column>
        <el-table-column label="操作">
            <template slot-scope="scope">
                <el-button
                    icon="el-icon-edit"
                    type="primary"
                    size="small"
                    @click="handleEdit(scope.row)"
                    v-if="hasPermission('sys:role:edit')"
                >编辑</el-button>
                <el-button
                    icon="el-icon-delete"
                    type="danger"
                    size="small"
                    @click="handleDelete(scope.row)"
                    v-if="hasPermission('sys:role:delete')"
                >删除</el-button>
                <el-button
                    icon="el-icon-setting"
                    type="primary"
                    size="small"
                    @click="assignRole(scope.row)"
                    v-if="hasPermission('sys:role:assign')"
                >分配权限</el-button>
            </template>
        </el-table-column>
    </el-table>
    <!--分页工具-->
    <el-pagination
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pageNo"
        :page-sizes="[10,20,30,40,50]"
        :page-size="10"
        layout="total,sizes,prev,pager,next,jumper"
        :total="total"
    ></el-pagination>
    <!--layout是底下的页码栏的元素的显示顺序-->
    <system-dialog
        :title="roleDialog.title"
        :visible="roleDialog.visible"
        :width="roleDialog.width"
        :height="roleDialog.height"
        @onClose="onClose"
        @onConfirm="onConfirm"
    >
        <div slot="content">
            <el-form
                :model="role"
                ref="roleForm"
                :rules="rules"
                label-width="80px"
                :inline="false"
                size="small"
            >
                <el-form-item label="角色编码" prop="roleCode">
                    <el-input v-model="role.roleCode"></el-input>
                </el-form-item>
                <el-form-item label="角色名称" prop="roleName">
                    <el-input v-model="role.roleName"></el-input>
                </el-form-item>
                <el-form-item label="角色描述">
                    <el-input v-model="role.remark"></el-input>
                </el-form-item>
            </el-form>
        </div>
    </system-dialog>
    <system-dialog
        :title="assignDialog.title"
        :visible="assignDialog.visible"
        :width="assignDialog.width"
        :height="assignDialog.height"
        @onClose="onAssignClose"
        @onConfirm="onAssignConfirm"
        >
        <div slot="content">
            <!--node-key='id' 这要和后端对应,通过id字段来标识我的每个节点-->
            <!--默认不显示复选框,:show-checkbox默认为false-->
            <el-tree
                ref="assignTree"
                :data="assignTreeData"
                node-key="id"
                :props="defaultProps"
                empty-text="暂无数据"
                :show-checkbox="true"
                :highlight-current="true"
                default-expand-all
            ></el-tree>
        </div>
    </system-dialog>
  </el-main>
</template>

<script>
import roleApi from "@/api/role"
import SystemDialog from '@/components/system/SystemDialog.vue';
import leafUtils from '@/utils/leaf'

export default {
    name:"roleList",
    components:{
        SystemDialog,
    },
    data(){
        return{
            //查询条件
            searchModel:{
                roleName:'',
                pageNo:1,
                pageSize:10,
                userId:this.$store.getters.userId//用户id
            },
            roleList:[],//数据列表
            tableHeight:0,//表格高度
            pageNo:1,//当前页码
            pageSize:10,//每页显示数量
            total:0,//总数量
            role:{
                id:"",
                roleName:"",
                roleCode:"",
                remark:"",
                createUser:this.$store.getters.userId
            },
            roleDialog:{
                title:"",
                visible:false,
                height: 230,
                width: 500,
            },
            //表单验证规则
            rules:{
                roleCode:[{required:true,trigger:"blur",message:"请输入角色编码"}],
                roleName:[{required:true,trigger:"blur",message:"请输入角色名称"}],
            },
            //分配权限窗口属性
            assignDialog:{
                title:"",
                visible:false,
                height:450,
                width:300,
            },
            roleId:"",//放在全局位置,在真正实现分配权限时可以引用这个数据
            assignTreeData:[],//权限树数据
            //权限树属性
            defaultProps:{
                children:"children",//这两个字符串中的值需和后端数据对应
                label:"label"
            },
        }
    },
    methods:{
        //查询
        async search(pageNo=1,pageSize=10){
            this.searchModel.pageNo=pageNo;
            this.search.pageSize=pageSize;
            let res=await roleApi.getRoleListApi(this.searchModel)
            if(res.success){
                //角色列表
                this.roleList=res.data.records;
                //总数量
                this.total=res.data.total;
            }
        },
        //重置
        resetValue(){
            //清空查询条件
            this.searchModel.roleName="";
            //重新查询
            this.search();
        },
        //打开添加窗口
        openAddWindow(){
            this.$resetForm("roleForm",this.role);//清空表单数据
            this.roleDialog.title="新增角色";
            this.roleDialog.visible=true;
        },
        //窗口确认事件
        onConfirm(){
            this.$refs.roleForm.validate(async(valid)=>{
                if(valid){
                    let res=null;
                    //判断角色列表id是否为空
                    if(this.role.id===""){
                        res=await roleApi.addRoleApi(this.role);
                    }else{
                        //发送修改请求
                        res=await roleApi.updateRoleApi(this.role)
                    }
                    if(res.success){
                        this.$message.success(res.message);
                        //刷新
                        this.search(this.pageNo,this.pageSize);
                        //关闭窗口
                        this.roleDialog.visible=false;
                    }else{
                        this.$message.error(res.message);
                    }
                };
            })
        },
        //关闭窗口
        onClose(){
            this.roleDialog.visible=false;
        },
        //当每页数量发生变化时触发该事件
        handleSizeChange(size){
            this.pageSize=size;//将每页显示数量交给成员变量
            this.search(this.pageNo,size);
        },
        //当页码发生变化时触发该事件
        handleCurrentChange(page){
            this.pageNo=page;
            //调用查询方法
            this.search(page,this.pageSize);
        },
        //打开编辑窗口
        handleEdit(row){
            this.$objCopy(row,this.role)//数据回显
            this.roleDialog.title="编辑角色"
            this.roleDialog.visible=true;
        },
        //分配权限(数据回显,没有确认后的ORM操作)
        async assignRole(row){
            //设置角色ID
            this.roleId=row.id;
            //构建传给后端的参数
            let params={
                roleId:row.id,
                userId:this.$store.getters.userId
            }
            //发送查询请求
            let res=await roleApi.getAssignTreeAPi(params);
            //需要加await和async关键字才能链式调用(res.data)
            if(res.success){
                let permissionList=res.data.permissionList;
                let checkList=res.data.checkList;
                let {setLeaf}=leafUtils();
                //设置好open对于叶子节点的标识后,赋值给新的变量
                let newpermissionList=setLeaf(permissionList);
                //将新变量(登录角色拥有的全部权限)赋值给树形控件的数据源变量
                this.assignTreeData=newpermissionList;
                //将回调延迟到下次DOM更新循环之后执行,在修改数据之后立即使用它,然后等待DOM更新
                this.$nextTick(()=>{
                    //获取全部节点
                    let nodes=this.$refs.assignTree.children
                    //设置子节点
                    this.setChild(nodes,checkList);
                })
            }
            //显示窗口
            this.assignDialog.visible=true;
            this.assignDialog.title=`给【${row.roleName}】分配权限`
        },
        /**
         * 设置子节点(显示角色的已有权限(仅展示其与登录用户的交集))
         */
        setChild(childnodes,checkList){
            //判断是否存在子节点
            if(childnodes && childnodes.length>0){
                //循环所有权限
                for( let i=0;i<childnodes.length;i++){
                    //根据key或data拿到各个Tree的node(循环拿到每一个)
                    let node=this.$refs.assignTree.getNode(childnodes[i])
                    if(checkList && checkList.length>0){
                        //循环遍历已有的权限集合
                        for(let j=0;j<checkList.length;j++){
                            /*找到已经存在的菜单权限集合,
                            这段代码的目的是在打开回显界面时就自动勾选原有角色的权限--叶子节点(当然是交集)
                                尽管checkList里也有父权限(节点),但勾选完子节点的Tree会自动勾选父节点
                                所以无需对父节点进行操作*/
                            if(checkList[j]==childnodes[i].id){
                                if(childnodes[i].open){
                                    this.$refs.assignTree.setChecked(node,true)
                                    //setChecked方法是选中节点
                                    break;
                                }
                            }
                        }
                    }
                    //如果存在子节点,就递归选中
                    if(childnodes[i].children){
                        this.setChild(childnodes[i].children,checkList);
                    }
                }
            }
        },
        //分配权限窗口确认事件
        async onAssignConfirm(){
            //获取选中的节点key(已将节点的node-key设置为'id')
            let ids=this.$refs.assignTree.getCheckedKeys()
            //获取选中节点的父节点id
            let pids=this.$refs.assignTree.getHalfCheckedKeys()
            //组装两组节点
            let listId=ids.concat(pids)
            console.log(listId)
            //组装参数
            let params={
                roleId:this.roleId,
                list:listId,
            }
            //发送请求
            let res=await roleApi.assignSaveApi(params)
            if(res.success){
                //关闭窗口
                this.assignDialog.visible=false;
                //提示成功
                this.$message.success(res.message);
            }else{
                this.$message.error(res.message);
            }
        },
        //分配权限窗口取消事件
        onAssignClose(){
            this.assignDialog.visible=false;
        },
        //删除
        async handleDelete(row){
            let resCheck=await roleApi.checkHaveUserApi({id:row.id});//restful风格的get请求
            if(!resCheck.success){
                this.$message.warning(resCheck.message);
            }else{
                let confirm=await this.$myconfirm("确定要删除该角色吗");
                if(confirm){
                    let res=await roleApi.deleteRoleApi({id:row.id});
                    if(res.success){
                        //删除成功
                        this.$message.success(res.message);
                        //刷新
                        this.search(this.pageNo,this.pageSize);
                    }else{
                        this.$message.error(res.message);
                    }
                }
            }
        }
    },
    //初始化调用
    created(){
        this.search();
    },
    //挂载后调用
    mounted(){
        this.$nextTick(()=>{
            this.tableHeight=window.innerHeight-220;
        })
    },
};
</script>