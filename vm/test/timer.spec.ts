import { Project } from '../src/project';

jest.setTimeout(30000);

describe('timer', () => {
  it('创建项目实例', async () => {
    const project = new Project();
    project.init([]);
  });
});
