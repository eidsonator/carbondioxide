import Vue from 'vue'
import Router from 'vue-router'
import Collect from '@/components/Collect'
import Config from '@/components/Config'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Collect',
      component: Collect
    },
    {
      path: '/config',
      name: 'Config',
      component: Config
    }
  ]
})
