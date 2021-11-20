import {IBuildYaml, IJobData} from '../Job.types';
import * as path from 'path';
import * as JsYaml from 'js-yaml';

const dockerBuildRegistry = (
    dir: string,
    data: IJobData,
    parameter: Record<string, string>,
    env: Record<string, string>,
): string => {
    const yaml = [];
    const [name, tag] = data.pipeline.cv_name_image.split(':');
    const names = name.split('/');
    yaml.push({
        hosts: 'app-hosts',
        tasks: [
            {
                name: 'Install docker-py python package',
                pip: {
                    name: 'docker-py',
                },
            },
            {
                name: 'Git clone',
                'ansible.builtin.git': {
                    repo: data.pipeline.cv_path,
                    dest: path.join(parameter.build_dir || '/tmp', data.ck_id),
                    clone: 'yes',
                    version: parameter.git_branch,
                },
            },
            {
                name: data.pipeline.ck_id,
                docker_image: {
                    path: data.pipeline.cv_path_extra
                        ? path.join(parameter.build_dir || '/tmp', data.ck_id, data.pipeline.cv_path_extra)
                        : path.join(parameter.build_dir || '/tmp', data.ck_id),
                    name: names.length === 2 ? name : path.join(names[names.length - 2], names[names.length - 1]),
                    repository: names.length > 2 ? name : path.join(parameter.repository, name),
                    push: 'yes',
                    nocache: 'yes',
                    force: 'yes',
                    tag,
                    buildargs: env,
                    timeout: 7200,
                    ...(parameter.ansible_docker_image ? JSON.parse(parameter.ansible_docker_image) : {}),
                },
            },
            {
                name: `Clean dir ${data.pipeline.cv_name}`,
                file: {
                    state: 'absent',
                    path: path.join(parameter.build_dir || '/tmp', data.ck_id),
                },
            },
        ],
    });

    return JsYaml.dump(yaml);
};

const podmanBuildRegistry = (
    dir: string,
    data: IJobData,
    parameter: Record<string, string>,
    env: Record<string, string>,
): string => {
    const yaml = [];
    const [name, tag] = data.pipeline.cv_name_image.split(':');
    const names = name.split('/');
    yaml.push({
        hosts: 'app-hosts',
        tasks: [
            {
                name: 'Install docker-py python package',
                pip: {
                    name: 'docker-py',
                },
            },
            {
                name: 'Git clone',
                'ansible.builtin.git': {
                    repo: data.pipeline.cv_path,
                    dest: path.join(parameter.build_dir || '/tmp', data.ck_id),
                    clone: 'yes',
                    version: parameter.git_branch,
                },
            },
            {
                name: `Build image ${data.pipeline.cv_name}`,
                'containers.podman.podman_image': {
                    path: data.pipeline.cv_path_extra
                        ? path.join(parameter.build_dir || '/tmp', data.ck_id, data.pipeline.cv_path_extra)
                        : path.join(parameter.build_dir || '/tmp', data.ck_id),
                    name: names.length === 2 ? name : path.join(names[names.length - 2], names[names.length - 1]),
                    build: {
                        extra_args: Object.entries(env)
                            .map(([key, value]) => `--build-arg=${key}=${value}`)
                            .join(' '),
                    },
                    nocache: 'yes',
                    force: 'yes',
                    push: 'yes',
                    push_args: {
                        dest: names.length > 2 ? name : path.join(parameter.repository, name),
                    },
                    tag,
                    ...(parameter.ansible_podman_image ? JSON.parse(parameter.ansible_podman_image) : {}),
                },
            },
            {
                name: `Clean dir ${data.pipeline.cv_name}`,
                file: {
                    state: 'absent',
                    path: path.join(parameter.build_dir || '/tmp', data.ck_id),
                },
            },
        ],
    });

    return JsYaml.dump(yaml);
};

const appPodmanBuild = (
    dir: string,
    data: IJobData,
    parameter: Record<string, string>,
    env: Record<string, string>,
): string => {
    const yaml = [];
    yaml.push({
        hosts: 'app-hosts',
        tasks: [
            {
                name: `Run image ${data.pipeline.cv_name}`,
                'containers.podman.podman_container': {
                    name: parameter.name_run_image || data.pipeline.ck_id,
                    image: data.pipeline.cv_path,
                    state: parameter.docker_state || 'started',
                    restart_policy: parameter.docker_restart_policy || 'always',
                    restart: parameter.docker_restart_policy || 'yes',
                    recreate: parameter.docker_recreate || 'yes',
                    ports: [`${data.pipeline.cn_publish_port}:${data.pipeline.cn_local_port}`],
                    volume: parameter.docker_volume ? parameter.docker_volume.split(',') : undefined,
                    env,
                    ...(parameter.ansible_podman_container ? JSON.parse(parameter.ansible_podman_container) : {}),
                },
            },
        ],
    });

    return JsYaml.dump(yaml);
};

const appDockerBuild = (
    dir: string,
    data: IJobData,
    parameter: Record<string, string>,
    env: Record<string, string>,
): string => {
    const yaml = [];
    yaml.push({
        hosts: 'app-hosts',
        tasks: [
            {
                name: 'Install docker-py python package',
                pip: {
                    name: 'docker-py',
                },
            },
            {
                name: `Run image ${data.pipeline.cv_name}`,
                docker_container: {
                    name: parameter.name_run_image || data.pipeline.ck_id,
                    image: data.pipeline.cv_path,
                    state: parameter.docker_state || 'started',
                    restart_policy: parameter.docker_restart_policy || 'always',
                    restart: parameter.docker_restart_policy || 'yes',
                    recreate: parameter.docker_recreate || 'yes',
                    ports: [`${data.pipeline.cn_publish_port}:${data.pipeline.cn_local_port}`],
                    volume: parameter.docker_volume ? parameter.docker_volume.split(',') : undefined,
                    env,
                    ...(parameter.ansible_docker_container ? JSON.parse(parameter.ansible_docker_container) : {}),
                },
            },
        ],
    });

    return JsYaml.dump(yaml) as string;
};

export const builders: IBuildYaml = {
    ['docker-build-registry']: dockerBuildRegistry,
    ['podman-build-registry']: podmanBuildRegistry,
    ['app-podman']: appPodmanBuild,
    ['app-docker']: appDockerBuild,
};
