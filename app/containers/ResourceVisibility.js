/**
 * Created by edenp on 17/12/2017.
 */

import { connect } from 'react-redux';
import { ResourceVisibility } from 'cloudify-ui-components';
import stageUtils from '../utils/stageUtils';
import consts from '../utils/consts';

const mapStateToProps = (state, ownProps) => {
    let { allowedSettingTo } = ownProps;
    if (
        _.includes(ownProps.allowedSettingTo, consts.GLOBAL_VISIBILITY) &&
        !stageUtils.isUserAuthorized(consts.permissions.CREATE_GLOBAL_RESOURCE, state.manager)
    ) {
        allowedSettingTo = _.without(allowedSettingTo, consts.GLOBAL_VISIBILITY);
    }
    return {
        allowedSettingTo
    };
};

const mapDispatchToProps = (dispatch, ownProps) => {
    return {};
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ResourceVisibility);
