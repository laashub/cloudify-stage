/**
 * Created by pawelposel on 17/11/2016.
 */
  
import React, { Component, PropTypes } from 'react';
import PaginationInfo from './PaginationInfo';
import Paginator from './Paginator';
import SimplePaginator from './SimplePaginator';

export default class Pagination extends Component {

    static PAGE_SIZE_LIST = PaginationInfo.pageSizes;

    constructor(props,context) {
        super(props,context);

        this.state = {
            pageSize: props.pageSize,
            currentPage: 1,
        }

        this.disableStateUpdate = false;
    }

    static propTypes = {
        children: PropTypes.any.isRequired,
        fetchData: PropTypes.func.isRequired,
        pageSize: PropTypes.number.isRequired,
        totalSize: PropTypes.number,
        fetchSize: PropTypes.number,
        simple: PropTypes.bool
    };

    static defaultProps = {
        totalSize: 0,
        fetchSize: 0,
        simple: false,
        pageSize: Pagination.PAGE_SIZE_LIST[0]
    };

    _changePageSize(size){
        this.setState({pageSize: parseInt(size) || Pagination.PAGE_SIZE_LIST[0], currentPage: 1});
    }

    _changePage(page){
        this.setState({currentPage: page});
    }

    reset() {
        this.disableStateUpdate = true;
        this._changePage(1);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.disableStateUpdate) {
            this.disableStateUpdate = false;
            return false;
        }

        return true;
    }

    componentWillReceiveProps(nextProps) {
        let changedProps = {};

        if (this.props.pageSize != nextProps.pageSize) {
            changedProps.pageSize = nextProps.pageSize;
        }

        if (!this.props.simple) {
            let pageCount = Math.ceil(nextProps.totalSize / nextProps.pageSize);
            if (this.state.currentPage > pageCount) {
                changedProps.currentPage = 1;
            }
        }

        if (!_.isEmpty(changedProps)) {
            this.setState(changedProps);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (!_.isEqual(this.state, prevState)) {
            this.props.fetchData({gridParams: {...this.state}});
        }
    }

    render() {
        return (
            <div>
                {this.props.children}

                { (this.props.totalSize > Pagination.PAGE_SIZE_LIST[0] ||
                  (this.props.simple && !(this.state.currentPage == 1 && this.props.fetchSize < Pagination.PAGE_SIZE_LIST[0]))) &&
                    <div className="ui two column grid gridPagination">
                        <div className="column">
                            <PaginationInfo currentPage={this.state.currentPage} pageSize={this.state.pageSize}
                                            totalSize={this.props.totalSize} simple={this.props.simple}
                                            fetchSize={this.props.fetchSize}
                                            onPageSizeChange={this._changePageSize.bind(this)}/>
                        </div>
                        <div className="right aligned column">
                            {
                                this.props.simple &&
                                <SimplePaginator currentPage={this.state.currentPage} pageSize={this.state.pageSize}
                                           fetchSize={this.props.fetchSize} onPageChange={this._changePage.bind(this)}/>
                            }
                            {
                                !this.props.simple &&
                                <Paginator currentPage={this.state.currentPage} pageSize={this.state.pageSize}
                                           totalSize={this.props.totalSize}a onPageChange={this._changePage.bind(this)}/>
                            }
                        </div>
                    </div>
                }
            </div>
        );
    }
}