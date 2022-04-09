declare module '*.vue' {
  import { DefineComponent } from 'vue';
  import { Project } from 'egg/src/project';
  const component: DefineComponent<Record<string, any>, Record<string, any>, Record<string, any>, {
    $prj(): Project;
  }>;
  export default component;
}
