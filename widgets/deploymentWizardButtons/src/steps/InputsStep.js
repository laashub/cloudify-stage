/**
 * Created by jakub.niezgoda on 31/07/2018.
 */

import ResourceStatus from './helpers/ResourceStatus';
import NoResourceMessage from './helpers/NoResourceMessage';
import { createWizardStep } from '../wizard/wizardUtils';
import StepActions from '../wizard/StepActions';
import StepContent from '../wizard/StepContent';

const inputsStepId = 'inputs';

class InputsStepActions extends React.Component {
    constructor(props) {
        super(props);
    }

    static propTypes = StepActions.propTypes;

    static inputsDataPath = 'blueprint.inputs';

    onNext(id) {
        const { InputsUtils } = Stage.Common;

        return this.props
            .onLoading()
            .then(this.props.fetchData)
            .then(({ stepData }) => {
                const inputsWithoutValues = {};
                const blueprintInputsPlan = _.get(this.props.wizardData, InputsStepActions.inputsDataPath, {});
                const deploymentInputs = InputsUtils.getInputsToSend(
                    blueprintInputsPlan,
                    stepData,
                    inputsWithoutValues
                );

                if (!_.isEmpty(inputsWithoutValues)) {
                    return Promise.reject({
                        message: `Provide values for the following inputs: ${_.keys(inputsWithoutValues).join(', ')}`,
                        errors: inputsWithoutValues
                    });
                }
                return this.props.onNext(id, { inputs: { ...deploymentInputs } });
            })
            .catch(error => this.props.onError(id, error.message, error.errors));
    }

    render() {
        const { Wizard } = Stage.Basic;
        return <StepActions {...this.props} onNext={this.onNext.bind(this)} />;
    }
}

class InputsStepContent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            fileLoading: false
        };
    }

    static propTypes = StepContent.propTypes;

    static inputsDataPath = 'blueprint.inputs';

    static dataTypesDataPath = 'blueprint.dataTypes';

    componentDidMount() {
        const inputs = _.get(this.props.wizardData, InputsStepContent.inputsDataPath, {});
        const dataTypes = _.get(this.props.wizardData, InputsStepContent.dataTypesDataPath, {});

        const stepData = _.mapValues(inputs, (inputData, inputName) => {
            if (!_.isUndefined(this.props.stepData[inputName])) {
                return this.props.stepData[inputName];
            }
            const dataType =
                !_.isEmpty(dataTypes) && !!inputs[inputName].type ? dataTypes[inputs[inputName].type] : undefined;
            return Stage.Common.InputsUtils.getInputFieldInitialValue(inputData.default, inputData.type, dataType);
        });
        this.props.onChange(this.props.id, { ...stepData });
    }

    handleInputChange(event, field) {
        this.props.onChange(this.props.id, { ...this.props.stepData, ...Stage.Basic.Form.fieldNameValue(field) });
    }

    handleYamlFileChange(file) {
        if (!file) {
            return;
        }

        const { FileActions, InputsUtils } = Stage.Common;
        const actions = new FileActions(this.props.toolbox);
        this.setState({ fileLoading: true });

        actions
            .doGetYamlFileContent(file)
            .then(yamlInputs => {
                const plan = _.get(this.props.wizardData, InputsStepContent.inputsDataPath, {});
                const deploymentInputs = InputsUtils.getUpdatedInputs(plan, this.props.stepData, yamlInputs);
                this.props.onChange(this.props.id, { ...deploymentInputs });
                this.setState({ fileLoading: false });
            })
            .catch(err => {
                const errorMessage = `Loading values from YAML file failed: ${_.isString(err) ? err : err.message}`;
                this.props.onError(this.props.id, errorMessage, { yamlFile: errorMessage });
                this.setState({ fileLoading: false });
            });
    }

    getInputStatus(defaultValue) {
        if (_.isNil(defaultValue)) {
            return (
                <ResourceStatus
                    status={ResourceStatus.actionRequired}
                    text="Input has no default value defined. Please provide value."
                />
            );
        }
        return (
            <ResourceStatus
                status={ResourceStatus.noActionRequired}
                text="Input has default value defined. No action required."
            />
        );
    }

    render() {
        const { Divider, Form, Table } = Stage.Basic;
        const { DataTypesButton, InputsUtils, InputsHeader, YamlFileButton } = Stage.Common;

        const inputs = _.get(this.props.wizardData, InputsStepContent.inputsDataPath, {});
        const dataTypes = _.get(this.props.wizardData, InputsStepContent.dataTypesDataPath, {});
        const noInputs = _.isEmpty(inputs);

        return (
            <Form loading={this.props.loading} success={noInputs}>
                {noInputs ? (
                    <NoResourceMessage resourceName="inputs" />
                ) : (
                    <div>
                        <YamlFileButton
                            onChange={this.handleYamlFileChange.bind(this)}
                            dataType="deployment's inputs"
                            fileLoading={this.state.fileLoading}
                        />
                        {!_.isEmpty(dataTypes) && <DataTypesButton types={dataTypes} />}
                        <Divider hidden style={{ clear: 'both' }} />
                        <Table celled>
                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell>Input</Table.HeaderCell>
                                    <Table.HeaderCell colSpan="2">
                                        <InputsHeader header="Value" dividing={false} />
                                    </Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {_.map(_.keys(this.props.stepData), inputName => {
                                    if (!_.isNil(inputs[inputName])) {
                                        const dataType =
                                            !_.isEmpty(dataTypes) && !!inputs[inputName].type
                                                ? dataTypes[inputs[inputName].type]
                                                : undefined;
                                        const help = InputsUtils.getHelp(
                                            inputs[inputName].description,
                                            inputs[inputName].type,
                                            inputs[inputName].constraints,
                                            inputs[inputName].default,
                                            dataType
                                        );
                                        return (
                                            <Table.Row key={inputName} name={inputName}>
                                                <Table.Cell collapsing>
                                                    <Form.Field key={inputName} help={help} label={inputName} />
                                                </Table.Cell>
                                                <Table.Cell collapsing>
                                                    {this.getInputStatus(inputs[inputName].default)}
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {InputsUtils.getInputField(
                                                        inputName,
                                                        this.props.stepData[inputName],
                                                        inputs[inputName].default,
                                                        this.handleInputChange.bind(this),
                                                        this.props.errors[inputName],
                                                        inputs[inputName].type,
                                                        inputs[inputName].constraints
                                                    )}
                                                </Table.Cell>
                                            </Table.Row>
                                        );
                                    }
                                    return null;
                                })}
                            </Table.Body>
                        </Table>
                    </div>
                )}
            </Form>
        );
    }
}

export default createWizardStep(inputsStepId, 'Inputs', 'Provide inputs', InputsStepContent, InputsStepActions);
