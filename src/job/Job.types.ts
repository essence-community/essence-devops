import {HistoryPipelineModel} from '../entities/project/HistoryPipelineModel';
import {ParameterModel} from '../entities/project/ParameterModel';

export type IJobData = HistoryPipelineModel & {
    parameter: ParameterModel;
};

export interface IBuildYaml {
    [key: string]: (
        dir: string,
        data: IJobData,
        parameter: Record<string, string>,
        env: Record<string, string>,
    ) => string;
}
