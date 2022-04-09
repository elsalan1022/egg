import { createRouter, createWebHashHistory } from 'vue-router';
import index from '@/pages/index.vue';
import p404 from '@/pages/404.vue';

const routes = [
  {
    path: '/',
    component: index,
  },
  {
    path: '/:catchAll(.*)',
    component: p404,
    meta: {
      autoIgnored: true,
    },
  },
];

// setup router
const history = createWebHashHistory('/');
const router = createRouter({
  history,
  routes,
});

export default router;
