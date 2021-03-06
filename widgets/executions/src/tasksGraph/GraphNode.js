/**
 * Created by barucoh on 23/1/2019.
 */
/**
 * @property {Any} [graphNode] - A Graph Node to render
 */
import states from './States';

const textHeight = 18;
const rx = 3;
const stateBarHeight = 5;

const colors = {
    inProgress: 'rgb(215,227,45)',
    succeeded: 'rgb(3,191,0)',
    failed: 'rgb(249, 25, 25)'
};

const GraphNode = ({ graphNode }) => {
    const labels = graphNode.labels[0];

    let currentTextPlacement_Y = 0;

    const title = labels.display_title || [labels.text];
    const displayText = labels.display_text;

    const { state } = labels;
    const mappedState = _.findKey(states, stateArray => _.includes(stateArray, state));
    const stateColor = colors[mappedState];

    const headerHeight = _.size(title) * textHeight + textHeight / 2;
    return (
        <g className="g-tasks-graph-general">
            {stateColor && (
                <>
                    <rect
                        height={stateBarHeight * 3}
                        width={graphNode.width}
                        rx={rx}
                        stroke={stateColor}
                        style={{ fill: stateColor }}
                        transform={`translate(0, -${stateBarHeight})`}
                    />
                    <rect
                        transform={`translate(0.5, ${headerHeight})`}
                        height={graphNode.height - headerHeight}
                        width={graphNode.width - 1}
                        strokeWidth={0}
                        style={{ fill: stateColor }}
                        opacity={0.5}
                    />
                </>
            )}
            <rect
                transform="translate(0.5, 0.5)"
                height={headerHeight}
                width={graphNode.width - 1}
                strokeWidth={0}
                style={{ fill: !_.isEmpty(graphNode.children) ? '#F2F2F2' : 'white' }}
            />
            <rect height={graphNode.height} width={graphNode.width} rx={rx} fillOpacity={0} />
            <path d={`m 0,${headerHeight} h ${graphNode.width} z`} strokeWidth={0.5} />
            {title !== null &&
                title.map(line => (
                    <text
                        key={currentTextPlacement_Y}
                        className="text-tasks-graph-subgraph-title"
                        transform={
                            graphNode.children && graphNode.children.length === 0 // Placing text according to subgraph tier
                                ? `translate(10, ${(currentTextPlacement_Y += textHeight)})`
                                : 'translate(12, 18)'
                        }
                    >
                        {line}
                    </text>
                ))}
            >
            {displayText &&
                displayText.map(line => (
                    <text
                        key={currentTextPlacement_Y}
                        className="text-tasks-graph-operation-and-state"
                        transform={`translate(10, ${(currentTextPlacement_Y += textHeight) + 7})`}
                    >
                        {line}
                    </text>
                ))}
        </g>
    );
};

GraphNode.propTypes = {
    graphNode: PropTypes.shape({
        labels: PropTypes.arrayOf(
            PropTypes.shape({
                displayTitle: PropTypes.arrayOf(PropTypes.string),
                text: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
                state: PropTypes.string
            })
        ),
        height: PropTypes.number,
        width: PropTypes.number,
        children: PropTypes.array
    }).isRequired
};

export default GraphNode;
