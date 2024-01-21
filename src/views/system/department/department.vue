<template>
  <el-main>
    <!-- 查询条件 -->
    <el-form
      :model="searchModel"
      ref="searchForm"
      label-width="80px"
      :inline="true"
      size="small"
    >
      <el-form-item>
        <el-input
          placeholder="请输入部门名称"
          v-model="searchModel.departmentName"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="search()"
          >查询</el-button
        >
        <el-button icon="el-icon-refresh-right" @click="resetValue()"
          >重置</el-button
        >
        <el-button type="success" icon="el-icon-plus" @click="openAddWindow()"
          v-if="hasPermission('sys:department:add')"
          >新增</el-button
        >
      </el-form-item>
    </el-form>
    <!-- 数据表格 -->
    <el-table
      :data="tableData"
      border
      stripe
      style="width: 100%; margin-bottom: 20px"
      row-key="id"
      default-expand-all
      :tree-props="{ children: 'children' }"
      ><!--prop是与后端api传过来的数据字段对应,也就是department类的字段-->
      <el-table-column prop="departmentName" label="部门名称"></el-table-column>
      <el-table-column prop="parentName" label="所属部门"></el-table-column>
      <el-table-column prop="phone" label="部门电话"></el-table-column>
      <el-table-column prop="address" label="部门地址"></el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template slot-scope="scope">
          <!--此处插槽的数据源和<el-table>的data属性有映射关系,也可把data看成它的数据源-->
          <!--数据源是数组,scope.row是数据源的每一行,每一个单位-->
          <el-button
            icon="el-icon-edit-outline"
            type="primary"
            size="small"
            @click="handleEdit(scope.row)"
            v-if="hasPermission('sys:department:edit')"
            >编辑
          </el-button>
          <el-button
            icon="el-icon-close"
            type="danger"
            size="small"
            @click="handleDelete(scope.row)"
            v-if="hasPermission('sys:department:delete')"
            >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!--添加和修改窗口-->
    <system-dialog
      :title="deptDialog.title"
      :visible="deptDialog.visible"
      :width="deptDialog.width"
      :height="deptDialog.height"
      @onClose="onClose"
      @onConfirm="onConfirm"
    >
      <div slot="content">
        <el-form
          :model="dept"
          ref="deptForm"
          :rules="rules"
          label-width="80px"
          :inline="true"
          size="small"
        >
        <!--此处的prop是为了校验,没有加prop的字段不会被校验-->              
        <!--v-model=""用以实现双向数据绑定,方便同步数据和视图的状态-->
          <el-form-item label="所属部门" prop="parentName">
            <el-input v-model="dept.parentName" :readonly="true"
                        @click.native="selectDepartment()"></el-input>
          </el-form-item>
          <el-form-item label="部门名称" prop="departmentName">
            <el-input v-model="dept.departmentName"></el-input>
          </el-form-item>
          <el-form-item label="部门地址">
            <el-input v-model="dept.address"></el-input>
          </el-form-item>
          <el-form-item label="部门电话">
            <el-input v-model="dept.phone"></el-input>
          </el-form-item>
          <el-form-item label="序号">
            <el-input v-model="dept.orderNum"></el-input>
          </el-form-item>
        </el-form>
      </div>
    </system-dialog>
    <!--添加所属部门窗口-->
    <system-dialog
      :title="parentDialog.title"
      :visible="parentDialog.visible"
      :width="parentDialog.width"
      :height="parentDialog.height"
      @onClose="parentOnClose"
      @onConfirm="parentOnConfirm"
    >
      <div slot="content"><!--content是框架里自带的,有dialog时就设置这个值-->
        <el-tree
          ref="parentTree"
          :data="treeList"
          node-key="id"
          :props="defaultProps"
          :default-expand-all="true"
          :highlight-current="true"
          :expand-on-click-node="false"
          @node-click="handleNodeClick"
        >   <!--node是针对单个节点的数据,data是整个数据源-->
          <div class="customr-tree-node" slot-scope="{ node, data }">
            <span v-if="data.children.length === 0">
              <i class="el-icon-document"></i>
            </span>
            <!--此处没有设置@click.stop来阻止父组件事件的冒泡,也就是说,在点击加减号执行openBtn函数时,handleNodeClick事件也会执行-->
            <span v-else @click="openBtn(data)">
              <svg-icon v-if="data.open" icon-class="add-s"></svg-icon>
              <svg-icon v-else icon-class="sub-s" ></svg-icon>
            </span>
            <span style="margin-left: 5px">{{ node.label }}</span>
          </div>
        </el-tree>
      </div>
    </system-dialog>
  </el-main>
</template>


<script>
import departmentApi from "@/api/department";
import SystemDialog from "@/components/system/SystemDialog.vue";


export default {
  name: "department",
  components: {
    SystemDialog,
  },
  data() {
    return {
      searchModel: {
        departmentName: "",
      },
      tableData: [], //表格数据列表
      //部门窗口属性
      deptDialog: {
        title: "新增部门",
        visible: false,
        width: 560,
        height: 170,
      },
      //部门对象
      dept: {
        id: "",
        pid: "",
        parentName: "",
        departmentName: "",
        address: "",
        phone: "",
        orderNum: "",
      },
      //表单填写的约束规则(必填项之类)
      rules: {
        parentName: [
          { required: true, trigger: "change", message: "请选择所属部门" },
        ],
        departmentName: [
          { required: true, trigger: "blur", message: "请输入部门名" },
        ],
      },
      //选择所属部门属性(使用tree树形控件)
      parentDialog: {
        title: "选择所属部门",
        visible: false,
        width: 300,
        height: 400,
      },
      treeList: [], //树形菜单列表
      defaultProps: {
        children: "children",
        label: "departmentName",
      },
    };
  },
  methods: {
    async search() {
      //发送查询请求
      const res = await departmentApi.getDepartmentList(this.searchModel);
      //判断是否存在数据
      if (res.success) {
        //获取数据
        this.tableData = res.data;
      }
    },
    /**
     * 重置
     */
    resetValue() {
      this.searchModel = {}; //清空数据
      this.search(); //重新调用方法
    },
    //关闭弹窗,将其设置为不可见
    onClose() {
      this.deptDialog.visible = false;
    },
    //弹窗确认事件
    onConfirm() {
      this.$refs.deptForm.validate(async (valid) => {
        if (valid) {
          let res=null;//后端返回的数据
          if(this.dept.id===""){
            //发送新增请求
            res=await departmentApi.addDept(this.dept);
          }else {
            //发送修改请求
            res=await departmentApi.updateDept(this.dept);
          }
          //判断是否成功
          if(res.success){
            this.$message.success(res.message);
            //刷新
            this.resetValue();
            //关闭窗口
            this.deptDialog.visible=false;
          }else {
            this.$message.error(res.message);
          }
        }
      });
    },
    //打开窗口函数
    openAddWindow() {
      //清空表单数据(以免关掉再打开时会出现原来的值)
      this.$resetForm("deptForm",this.dept);
      //设置窗口标题
      (this.deptDialog.title = "新增部门"), (this.deptDialog.visible = true);
    },
    async selectDepartment() {
      this.parentDialog.visible = true;
      this.parentDialog.title = "选择所属部门";
      let res = await departmentApi.getParentTreeList();
      if (res.success) {
        this.treeList = res.data;
        console.log(this.treeList)
      }
    },
    //选择所属部门取消事件
    parentOnClose() {
      this.parentDialog.visible = false;
    },
    //选择所属部门确认事件
    parentOnConfirm() {
      this.parentDialog.visible = false;
    },
    handleNodeClick(data) {
      //当点击树节点时，赋予选中的值
      this.dept.pid = data.id;
      this.dept.parentName = data.departmentName;
    },
    //点击树节点加减号时折叠展开的事件
    openBtn(data) {
      data.open = !data.open;
      this.$refs.parentTree.store.nodesMap[data.id].expanded = !data.open;
    },
    //编辑部门
    handleEdit(row){
      //数据回显(row的数据复制到this.dept)
      this.$objCopy(row,this.dept);
      //设置窗口标题
      this.deptDialog.title="编辑部门"
      //显示编辑部门窗口
      this.deptDialog.visible=true;
    },
    //删除部门
    async handleDelete(row){
      //查询是否存在子部门
      let result=await departmentApi.checkDepartment({id:row.id})
      //判断是否可以删除
      if(!result.success){
        this.$message.warning(result.message);
      }else{
        //确认是否删除
        let confirm = await this.$myconfirm("确定要删除这些值吗");
        if(confirm){
          let res=await departmentApi.deleteById({id:row.id});//创建了一个包含单个属性的对象,为键值对
          if(res.success){
            //成功提示
            this.$message.success(res.message);
            //刷新
            this.resetValue();
          }else {
            //失败提示
            this.$message.error(res.message);
          }
        }
      }
    }
  },
  //初始化时执行(在界面渲染之前就获取数据,用户一打开就可看到数据)
  created() {
    //生命周期钩子函数
    this.search();
  },
};
</script>

<style lang="scss" scoped>
::v-deep .el-tree {
  .el-tree-node {
    position: relative;
    padding-left: 10px;
  }
  .el-tree-node__children {
    padding-left: 20px;
  }
  .el-tree-node :last-child:before {
    height: 40px;
  }
  .el-tree > .el-tree-node:before {
    border-left: none;
  }
  .el-tree > .el-tree-node:after {
    border-top: none;
  }
  .el-tree-node:before,
  .el-tree-node:after {
    content: "";
    left: -4px;
    position: absolute;
    right: auto;
    border-width: 1px;
  }
  .tree :first-child .el-tree-node:before {
    border-left: none;
  }
  .el-tree-node:before {
    border-left: 1px dotted #d9d9d9;
    bottom: 0px;
    height: 100%;
    top: -25px;
    width: 1px;
  }
  .el-tree-node:after {
    border-top: 1px dotted #d9d9d9;
    height: 20px;
    top: 14px;
    width: 24px;
  }
  .el-tree-node__expand-icon.is-leaf {
    width: 8px;
  }
  .el-tree-node__content > .el-tree-node__expand-icon {
    display: none;
  }
  .el-tree-node__content {
    line-height: 30px;
    height: 30px;
    padding-left: 10px !important;
  }
}
::v-deep .el-tree > div {
  &::before {
    display: none;
  }
  &::after {
    display: none;
  }
}
</style>