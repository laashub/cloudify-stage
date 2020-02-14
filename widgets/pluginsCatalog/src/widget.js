/**
 * Created by Tamer on 30/07/2017.
 */

import Actions from './Actions';
import PluginsCatalogList from './PluginsCatalogList';

Stage.defineWidget({
    id: 'pluginsCatalog',
    name: 'Plugins Catalog',
    description: 'Shows plugins catalog',
    initialWidth: 12,
    initialHeight: 20,
    color: 'teal',
    isReact: true,
    hasReadme: true,
    permission: Stage.GenericConfig.WIDGET_PERMISSION('pluginsCatalog'),
    initialConfiguration: [
        {
            id: 'jsonPath',
            name: 'Plugins Catalog JSON Source',
            placeHolder: 'Type JSON Path',
            default: Stage.Common.Consts.externalUrls.pluginsCatalog,
            type: Stage.Basic.GenericField.STRING_TYPE
        },
        {
            id: 'sortByName',
            name: 'Sort by name',
            description: 'If set to true, then plugins will be sorted by name.',
            default: false,
            type: Stage.Basic.GenericField.BOOLEAN_TYPE
        }
    ],

    /**
     * fetch data from source
     *
     * @param {any} widget
     * @param {any} toolbox
     * @param {any} params
     * @returns
     */
    fetchData(widget, toolbox, params) {
        const actions = new Actions({
            toolbox,
            ...widget.configuration
        });

        return actions.doGetPluginsList().catch(_.identity);
    },

    /**
     * render widget
     *
     * @param {any} widget
     * @param {any} data
     * @param {any} error
     * @param {any} toolbox
     * @returns
     */
    render(widget, data, error, toolbox) {
        if (data instanceof Error) {
            const { Message } = Stage.Basic;
            const { MessageContainer } = Stage.Shared;
            return (
                <MessageContainer wide margin="30px auto">
                    <Message>
                        The widget content cannot be displayed because there is no connection to plugins repository.
                        Please check network connection and widget's configuration.
                    </Message>
                </MessageContainer>
            );
        }

        if (_.isEmpty(data)) {
            return <Stage.Basic.Loading />;
        }

        const actions = new Actions({
            toolbox,
            ...widget.configuration
        });

        if (_.get(widget.configuration, 'sortByName', false)) {
            data = _.sortBy(data, 'title');
        }

        return <PluginsCatalogList widget={widget} items={data} toolbox={toolbox} actions={actions} />;
    }
});
