import Vue from 'vue'
import Router from 'vue-router'
import Collect from '@/components/Collect'
import Config from '@/components/Config'
import Tests from '@/components/Tests'

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
    },
    {
      path: '/tests',
      name: 'Tests',
      component: Tests
    }
  ]
})
