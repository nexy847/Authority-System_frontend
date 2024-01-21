//导入路由脚本文件中的方法
import { constantRoutes } from '@/router'
import { getMenuList } from '@/api/user'

import Layout from '@/layout'
/**
 * Use meta.role to determine if the current user has permission
 * 判断当前登录用户是否拥有该角色下的菜单信息
 * @param roles
 * @param route
 */
function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {//some函数判断数组中是否有至少一个元素符合给定的函数
    return roles.some(role => route.meta.roles.includes(role))
  } else {//表示这个路由没有任何权限限制(一种默认的做法)
    return true
  }
}

/**
 * Filter asynchronous routing tables by recursion
 * 过滤出所拥有的菜单信息
 * @param routes asyncRoutes
 * @param roles
 */
export function filterAsyncRoutes(routes, roles) {
  const res = []
  //forEach方法需要一个回调函数作为参数,用于对数组的每个元素执行某些操作
  routes.forEach(route => {//箭头函数用于定义一个回调函数
    const tmp = { ...route }//拓展运算符,将route对象的所有属性复制到tmp对象(不改变原有的route对象)
    //判断是否拥有相应的权限
    if (hasPermission(roles, tmp)) {
      //,读取该路由对应的组件
      let component = tmp.component;
      if(route.component){
        if (component === 'Layout') {
          tmp.component = Layout;
        } else {
          //获取对应的具体的组件信息(require可动态导入一个模块,resolve接收一个模块的导出对象--组件,两者都是函数)
          tmp.component = (resolve) => require([`@/views${component}`], resolve)
        }
      }
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
      }
      res.push(tmp)
    }
  })

  return res
}

const state = {
  routes: [],
  addRoutes: []
}

const mutations = {
  //将路由信息保存到store中(Vuex)
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  }
}

const actions = {
  //动态生成路由
  generateRoutes({ commit }, roles) {
    return new Promise((resolve, reject) => {//async函数会返回Promis对象,表示异步操作的结果
      getMenuList().then(res => {
        let accessedRoutes;//存放对应权限的路由信息
        //如果状态码为200，则表示成功
        if (res.code === 200) {
          accessedRoutes = filterAsyncRoutes(res.data, roles)
        }
        //将路由信息保存到store中
        commit("SET_ROUTES", accessedRoutes);
        resolve(accessedRoutes);
      }).catch(error => {
        reject(error);
      });
    })
  }
}


export default {
  namespaced: true,
  state,
  mutations,
  actions
}