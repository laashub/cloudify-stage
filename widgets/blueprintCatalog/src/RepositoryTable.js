/**
 * Created by pposel on 08/02/2017.
 */

export default class extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired,
        widget: PropTypes.object.isRequired,
        fetchData: PropTypes.func,
        onSelect: PropTypes.func,
        onUpload: PropTypes.func,
        onReadme: PropTypes.func,
        readmeLoading: PropTypes.string,
        noDataMessage: PropTypes.string
    };

    static defaultProps = {
        fetchData: () => {},
        onSelect: () => {},
        onUpload: () => {}
    };

    render() {
        const { DataTable, Image, Icon } = Stage.Basic;

        return (
            <DataTable
                fetchData={this.props.fetchData}
                pageSize={this.props.widget.configuration.pageSize}
                sortColumn={this.props.widget.configuration.sortColumn}
                sortAscending={this.props.widget.configuration.sortAscending}
                totalSize={this.props.data.total}
                selectable
                noDataMessage={this.props.noDataMessage}
            >
                <DataTable.Column label="Name" width="25%" />
                <DataTable.Column label="Description" width="40%" />
                <DataTable.Column label="Created" width="12%" />
                <DataTable.Column label="Updated" width="12%" />
                <DataTable.Column width="11%" />

                {this.props.data.items.map(item => {
                    const isLoading = this.props.readmeLoading === item.name;
                    return (
                        <DataTable.Row
                            key={item.id}
                            selected={item.isSelected}
                            onClick={() => this.props.onSelect(item)}
                        >
                            <DataTable.Data>
                                <Image src={Stage.Utils.Url.url(item.image_url)} width="30px" height="auto" inline />{' '}
                                <a href={item.html_url} target="_blank">
                                    {item.name}
                                </a>
                            </DataTable.Data>
                            <DataTable.Data>{item.description}</DataTable.Data>
                            <DataTable.Data>{item.created_at}</DataTable.Data>
                            <DataTable.Data>{item.updated_at}</DataTable.Data>
                            <DataTable.Data className="center aligned rowActions">
                                <Icon
                                    name={isLoading ? 'spinner' : 'info'}
                                    link={!isLoading}
                                    title="Blueprint Readme"
                                    loading={isLoading}
                                    bordered={!isLoading}
                                    onClick={event => {
                                        event.stopPropagation();
                                        this.props.onReadme(item.name, item.readme_url);
                                    }}
                                />
                                <Icon
                                    name="upload"
                                    link
                                    title="Upload blueprint"
                                    bordered
                                    onClick={event => {
                                        event.stopPropagation();
                                        this.props.onUpload(item.name, item.zip_url, item.image_url);
                                    }}
                                />
                            </DataTable.Data>
                        </DataTable.Row>
                    );
                })}
            </DataTable>
        );
    }
}
