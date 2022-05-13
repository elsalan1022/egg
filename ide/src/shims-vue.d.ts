declare module '*.vue' {
  import { DefineComponent } from 'vue';
  import { Project } from 'egg/src/project';

  const component: DefineComponent<{}, {}, any, {
    $prj(): Project;
  }>;
  export default component;
}
