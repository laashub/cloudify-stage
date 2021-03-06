/**
 * Created by pposel on 06/02/2017.
 */

export default class BlueprintInfo extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            error: ''
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !_.isEqual(this.props.widget, nextProps.widget) ||
            !_.isEqual(this.state, nextState) ||
            !_.isEqual(this.props.data, nextProps.data)
        );
    }

    render() {
        const { ErrorMessage, Grid, Image, ResourceVisibility, Message, Label } = Stage.Basic;

        const blueprint = this.props.data;

        if (!blueprint.id) {
            return (
                <div>
                    <Message info>No blueprint selected</Message>
                </div>
            );
        }

        return (
            <div>
                <ErrorMessage error={this.state.error} onDismiss={() => this.setState({ error: null })} autoHide />
                <Grid>
                    <Grid.Row className="bottomDivider">
                        <Grid.Column width="4">
                            <Image src={Stage.Utils.Url.url(`/ba/image/${blueprint.id}`)} centered />
                        </Grid.Column>
                        <Grid.Column width="12">
                            <h3 className="ui icon header verticalCenter">
                                <a className="underline blueprintInfoName" href="javascript:void(0)">
                                    {blueprint.id}
                                </a>
                            </h3>
                            <ResourceVisibility visibility={blueprint.visibility} className="rightFloated" />
                        </Grid.Column>
                    </Grid.Row>

                    <Grid.Column width="16">{blueprint.description}</Grid.Column>

                    <Grid.Row className="noPadded">
                        <Grid.Column width="7">
                            <h5 className="ui icon header">Created</h5>
                        </Grid.Column>
                        <Grid.Column width="9">{blueprint.created_at}</Grid.Column>
                    </Grid.Row>

                    <Grid.Row className="noPadded">
                        <Grid.Column width="7">
                            <h5 className="ui icon header">Updated</h5>
                        </Grid.Column>
                        <Grid.Column width="9">{blueprint.updated_at}</Grid.Column>
                    </Grid.Row>

                    <Grid.Row className="noPadded">
                        <Grid.Column width="7">
                            <h5 className="ui icon header">Creator</h5>
                        </Grid.Column>
                        <Grid.Column width="9">{blueprint.created_by}</Grid.Column>
                    </Grid.Row>

                    <Grid.Row className="noPadded">
                        <Grid.Column width="7">
                            <h5 className="ui icon header">Main Blueprint File</h5>
                        </Grid.Column>
                        <Grid.Column width="9">{blueprint.main_file_name}</Grid.Column>
                    </Grid.Row>

                    <Grid.Row className="noPadded">
                        <Grid.Column width="7">
                            <h5 className="ui icon header">Deployments</h5>
                        </Grid.Column>
                        <Grid.Column width="9">
                            <Label color="green" horizontal>
                                {blueprint.deployments}
                            </Label>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}
