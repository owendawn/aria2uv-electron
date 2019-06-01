import Vue from 'vue'
import VueRouter from 'vue-router'

import OnlyApp from '../page/app-only.vue'

import Download from '../page/download/download.vue'
import Wait from '../page/download/wait.vue'
import Finish from '../page/download/finish.vue'
import CommonSetting from '../page/setting/common-setting.vue'
import Aria2Setting from '../page/setting/aria2-setting.vue'


Vue.use(VueRouter)

const routes=[
    //{path: '/', component:OnlyApp, components: {default: Download}},


    {path: '/download', component:Download},
    {path: '/wait', component:Wait},
    {path: '/finish', component:Finish},
    {path: '/common-setting', component:CommonSetting},
    {path: '/aria2-setting', component:Aria2Setting},

    // // 重定向
     {
         path: '/',
         redirect: '/download'
     }
]

const router=new VueRouter({routes})

export default router