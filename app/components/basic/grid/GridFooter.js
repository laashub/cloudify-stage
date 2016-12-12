/**
 * Created by pawelposel on 17/11/2016.
 */
  
import React, { Component, PropTypes } from 'react';

export default class GridFooter extends Component {

    static propTypes = {
        children: PropTypes.any.isRequired,
    };

    render() {
        return (
            <tfoot>
                {this.props.children}
            </tfoot>
        );
    }
}
 