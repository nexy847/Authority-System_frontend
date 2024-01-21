import { login, logout, getInfo } from '@/api/user'
import { getToken, setToken, removeToken,setTokenTime/**设置token过期时间 */} from '@/utils/auth'
import router, { resetRouter } from '@/router'

const state = {
  token: getToken(),//获取token信息
  name: '',
  avatar: '',
  introduction: '',
  roles: []
}

const mutations = {
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_INTRODUCTION: (state, introduction) => {
    state.introduction = introduction
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles
  },
  SET_USERID: (state,userId) =>{
    state.userId=userId
  }
}

const actions = {
  // 用户登录
  login({ commit }, userInfo) {
    //从用户信息中解构出用户名和密码
    const { username, password } = userInfo
    console.log(username,password)
    return new Promise((resolve, reject) => {
      //传递用户名和密码参数,调用src/api/user.js文件中的login()方法
      login({ username: username.trim(), password: password }).then(response => {
        //解构出后端返回的数据
        console.log(username)
        const { 
          token,//token数据
          expireTime//token过期时间
        } = response//response里面的具体字段需要和后端对应
        //将返回的token信息保存到store中
        commit('SET_TOKEN', token)
        //设置token
        setToken(token)
        //设置token过期时间
        setTokenTime(expireTime);
        //放行
        resolve()
      }).catch(error => {
        reject(error)//拒绝访问
      })
    })
  },

  // get user info
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      getInfo(state.token).then(response => {
        const { data } = response

        if (!data) {
          reject('Verification failed, please Login again.')
        }

        const { roles, name, avatar, introduction,id } = data

        // roles must be a non-empty array
        if (!roles || roles.length <= 0) {
          reject('getInfo: roles must be a non-null array!')
        }

        commit('SET_ROLES', roles)
        commit('SET_NAME', name)
        commit('SET_AVATAR', avatar)
        commit('SET_INTRODUCTION', introduction)
        //将用户id保存到vuex中
        commit('SET_USERID',id)//用户id
        //将权限字段保存到sessionStorage中
        sessionStorage.setItem("codeList",JSON.stringify(roles));
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  },

  // user logout
  logout({ commit, state, dispatch }) {
    return new Promise((resolve, reject) => {
      logout(state.token).then(() => {
        commit('SET_TOKEN', '')
        commit('SET_ROLES', [])
        removeToken()
        resetRouter()

        // reset visited views and cached views
        // to fixed https://github.com/PanJiaChen/vue-element-admin/issues/2485
        dispatch('tagsView/delAllViews', null, { root: true })

        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '')
      commit('SET_ROLES', [])
      removeToken()
      resolve()
    })
  },

  // dynamically modify permissions
  async changeRoles({ commit, dispatch }, role) {
    const token = role + '-token'

    commit('SET_TOKEN', token)
    setToken(token)

    const { roles } = await dispatch('getInfo')

    resetRouter()

    // generate accessible routes map based on roles
    const accessRoutes = await dispatch('permission/generateRoutes', roles, { root: true })
    // dynamically add accessible routes
    router.addRoutes(accessRoutes)

    // reset visited views and cached views
    dispatch('tagsView/delAllViews', null, { root: true })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
