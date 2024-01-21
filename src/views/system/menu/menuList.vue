<template>
  <el-main>
    <el-button type="success" icon="el-icon-plus" @click="openAddWindow()"
        v-if="hasPermission('sys:menu:add')"
      >新增</el-button
    >
    <el-table
      :data="menuList"
      :height="tableHeight"
      style="margin-top: 10px"
      row-key="id"
      :border="true"
      stripe
      default-expand-all
      :tree-props="{ children: 'children' }"
    >
      <el-table-column prop="label" label="菜单名称"></el-table-column>
      <el-table-column prop="type" label="菜单类型" align="center">
        <template slot-scope="scope"
          ><!--type为success表示按钮类型为成功状态,显示为绿色-->
          <el-tag v-if="scope.row.type == '0'" size="normal">目录</el-tag>
          <el-tag type="success" v-else-if="scope.row.type == '1'" size="normal"
            >菜单</el-tag
          >
          <el-tag type="warning" v-else-if="scope.row.type == '2'" size="normal"
            >按钮</el-tag
          >
        </template>
      </el-table-column>
      <el-table-column prop="icon" label="图标" align="center">
        <template slot-scope="scope">
          <i
            :class="scope.row.icon"
            v-if="scope.row.icon.includes('el-icon')"
          ></i>
          <svg-icon v-else :icon-class="scope.row.icon"></svg-icon>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="路由名称"></el-table-column>
      <el-table-column prop="path" label="路由地址"></el-table-column>
      <el-table-column prop="url" label="组件路径"></el-table-column>
      <el-table-column label="操作" align="center">
        <template slot-scope="scope">
          <el-button
            type="primary"
            icon="el-icon-edit"
            size="small"
            @click="editMenu(scope.row)"
            v-if="hasPermission('sys:menu:edit')"
            >编辑</el-button
          >
          <el-button
            type="danger"
            size="small"
            icon="el-icon-delete"
            @click="deleteMenu(scope.row)"
            v-if="hasPermission('sys:menu:delete')"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <!--新增菜单窗口-->
    <system-dialog
      :title="menuDialog.title"
      :width="menuDialog.width"
      :height="menuDialog.height"
      :visible="menuDialog.visible"
      @onClose="onClose()"
      @onConfirm="onConfirm()"
    >
      <!--加了括号,会在模板解析时直接调用方法-->
      <div slot="content">
        <el-form
          :model="menu"
          ref="menuForm"
          :rules="rules"
          label-width="80px"
          :inline="true"
          size="small"
        >
          <el-row>
            <el-col span="24">
              <el-form-item prop="type" label="菜单类型">
                <el-radio-group v-model="menu.type">
                  <el-radio :label="0">目录</el-radio>
                  <el-radio :label="1">菜单</el-radio>
                  <el-radio :label="2">按钮</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item prop="parentName" size="small" label="所属菜单">
            <el-input
              @click.native="selectParentMenu"
              v-model="menu.parentName"
              :readonly="true"
            ></el-input>
          </el-form-item>
          <el-form-item prop="label" size="small" label="菜单名称">
            <el-input v-model="menu.label"></el-input>
          </el-form-item>
          <el-form-item size="small" label="菜单图标">
            <my-icon @selection="setIcon" ref="child"></my-icon>
          </el-form-item>
          <el-form-item
            prop="name"
            v-if="menu.type == 1"
            size="small"
            label="路由名称"
          >
            <el-input v-model="menu.name"></el-input>
          </el-form-item>
          <el-form-item
            prop="path"
            v-if="menu.type != 2"
            size="small"
            label="路由地址"
          >
            <el-input v-model="menu.path"></el-input>
          </el-form-item>
          <el-form-item
            prop="url"
            size="small"
            v-if="menu.type == 1"
            label="组件路径"
          >
            <el-input v-model="menu.url"></el-input>
          </el-form-item>
          <el-form-item prop="code" size="small" label="权限字段">
            <el-input v-model="menu.code"></el-input>
          </el-form-item>
          <el-form-item size="small" label="菜单序号">
            <el-input v-model="menu.orderNum"></el-input>
          </el-form-item>
        </el-form>
      </div>
    </system-dialog>
    <!--选择所属菜单-->
    <system-dialog
      :title="parentDialog.title"
      :width="parentDialog.width"
      :height="parentDialog.height"
      :visible="parentDialog.visible"
      @onClose="onParentClose"
      @onConfirm="onParentConfirm"
    >
      <!--不加括号,在事件触发时才调用方法-->
      <div slot="content">
        <el-tree
          style="font-size: 14px"
          ref="parentTree"
          :data="parentMenuTree"
          node-key="id"
          :props="defaultProps"
          empty-text="暂无数据"
          :show-checkbox="false"
          default-expand-all
          :highlight-current="true"
          :expand-on-click-node="false"
          @node-click="handleNodeClick"
        >
          <div class="customer-tree-node" slot-scope="{ node, data }">
            <!--长度为0说明没有下级-->
            <span v-if="data.children.length == 0">
              <i
                class="el-icon-document"
                style="color: #8c8c8c; font-size: 18px"
              />
            </span>
            <span v-else @click.stop="openBtn(data)">
              <svg-icon v-if="data.open" icon-class="add-s" />
              <svg-icon v-else icon-class="sub-s" />
            </span>
            <span style="margin-left: 3px">{{ node.label }}</span>
          </div>
        </el-tree>
      </div>
    </system-dialog>
  </el-main>
</template>

<script>
import menuApi from "@/api/menu";
import SystemDialog from "@/components/system/SystemDialog.vue";
//导入自定义图标组件
import MyIcon from "@/components/system/MyIcon.vue";

export default {
  name: "menuList",
  components: {
    SystemDialog,
    MyIcon,
  },
  created() {
    this.search();
  },
  data() {
    return {
      menuList: [], //菜单列表
      tableHeight: 0, //表格高度
      parentMenuTree: [], //所属菜单列表
      //窗口
      menuDialog: {
        title: "",
        visible: false,
        width: 630,
        height: 270,
      },
      //上级菜单弹框属性
      parentDialog: {
        title: "",
        visible: false,
        width: 280,
        height: 450,
      },
      //树属性定义
      defaultProps: {
        children: "children", //表示节点的子节点数组在数据中的字段名是 'children'
        label: "label", // 表示节点显示的文本在数据中的字段名是 'label'
      },
      //菜单属性
      menu: {
        id: "",
        pid: "",
        type:"",
        parentId: "",
        parentName: "",
        label: "",
        icon: "",
        name: "",
        path: "",
        url: "",
        code: "",
        orderNum: "",
      },
      //表单验证遵守规则
      rules: {
        type: [
          { required: true, trigger: "change", message: "请选择菜单类型" },
        ],
        parentName: [
          { required: true, trigger: "change", message: "请选择所属菜单" },
        ],
        label: [{ required: true, trigger: "blur", message: "请输入菜单名称" }],
        name: [{ required: true, trigger: "blur", message: "请输入路由名称" }],
        path: [{ required: true, trigger: "blur", message: "请输入路由地址" }],
        url: [{ required: true, trigger: "blur", message: "请输入组件地址" }],
        code: [{ required: true, trigger: "blur", message: "请输入权限字段" }],
      },
    };
  },
  methods: {
    //查找菜单列表
    async search() {
      let res = await menuApi.getMenuList();
      if (res.success) {
        this.menuList = res.data;
      }
    },
    //打开窗口
    openAddWindow() {
      this.$resetForm("menuForm", this.menu); //清空表单数据
      this.menuDialog.title = "新增菜单";
      this.menuDialog.visible = true;
      //清空菜单图标
      this.$nextTick(() => {
        this.$refs["child"].userChooseIcon = "";
      });
    },
    //窗口关闭事件
    onClose() {
      this.menuDialog.visible = false;
    },
    //窗口确认事件
    onConfirm() {
      this.$refs.menuForm.validate(async (valid) => {
        if (valid) {
          let res=null;
          if(this.menu.id===""){
            //发送新增请求
            res=await menuApi.add(this.menu);
          }else{
            //发送修改请求
            res=await menuApi.update(this.menu)
          }
          //判断是否成功
          if(res.success){
            this.$message.success(res.message);
            //刷新信息
            this.search();
            //关闭窗口
            this.menuDialog.visible=false;
          }else{
            this.$message.error(res.message);
          }
        }
      });
    },
    //选择所属菜单
    async selectParentMenu() {
      this.parentDialog.visible = true;
      let res = await menuApi.getParentMenuList();
      if (res.success) {
        this.parentMenuTree = res.data;
      }
    },
    //选择所属菜单取消事件
    onParentClose() {
      this.parentDialog.visible = false;
    },
    //选择所属菜单确认事件
    onParentConfirm() {
      this.parentDialog.visible = false;
    },
    //点击时切换图标
    openBtn(data) {
      data.open = !data.open;
      //(store是el-tree的对象,nodesMap是store的属性--键值对,值是对应的节点对象)
      this.$refs.store.nodesMap[data.id].expand = !data.open; //根据id来更新节点状态
    },
    //所属菜单节点点击事件
    handleNodeClick(data) {
      //所属父级菜单id
      this.menu.parentId = data.id;
      //所属父级菜单名称
      this.menu.parentName = data.label;
    },
    //编辑菜单
    editMenu(row){
      //数据回显
      this.$objCopy(row,this.menu);
      //设置窗口标题
      this.menuDialog.title="编辑菜单";
      //打开窗口
      this.menuDialog.visible=true;
      //菜单图标回显
      this.$$nextTick(()=>{
        this.$refs["child"].userChooseIcon=row.icon;
      })
    },
    //删除菜单
    async deleteMenu(row){
      let check=await menuApi.check({id:row.id});
      if(!check.success){
        this.$message.warning(check.message);
      }else{
        let confirm=await this.$myconfirm("确定要删除这些值吗");
        if(confirm){
          let res=await menuApi.deletById({id:row.id});
          if(res.success){
            this.$message.success(res.message);
            //刷新
            this.search();
          }else{
            this.$message.error(res.error);
          }
        }
      }
    }
  },
  //给icon绑定的事件点击
  setIcon(icon){
    this.menu.icon=icon;
  },
  mounted() {
    this.$nextTick(() => {
      //表格具有流体高度的原因
      this.tableHeight = window.innerHeight - 180;
    });
  },
};
</script>

<style scoped>
</style>
