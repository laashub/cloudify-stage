/**
 * Created by jakubniezgoda on 27/01/2017.
 */

class ExecutionActions {
    constructor(toolbox) {
        this.toolbox = toolbox;
    }

    doGetExecutions(deploymentId) {
        return this.toolbox
            .getManager()
            .doGet('/executions?_include=id,status,ended_at', { deployment_id: deploymentId });
    }

    doGetStatus(executionId) {
        return this.toolbox.getManager().doGet('/executions?_include=id,status', { id: executionId });
    }

    doAct(execution, action) {
        return this.toolbox.getManager().doPost(`/executions/${execution.id}`, null, {
            deployment_id: execution.deployment_id,
            action
        });
    }

    async waitUntilFinished(executionIds, interval) {
        const executions = await this.doGetStatus(executionIds);
        const activeExecutions = _.filter(executions.items, Stage.Utils.Execution.isActiveExecution);

        if (!_.isEmpty(activeExecutions)) {
            await new Promise(resolve => setTimeout(resolve, interval));
            return await this.waitUntilFinished(executionIds, interval);
        }
    }
}

Stage.defineCommon({
    name: 'ExecutionActions',
    common: ExecutionActions
});
