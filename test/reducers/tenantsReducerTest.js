'use strict';

/**
 * Created by kinneretzin on 11/12/2016.
 */
import {expect} from 'chai';
import sinon from 'sinon';

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { createStore,applyMiddleware } from 'redux'
import nock from 'nock';
import timeKeeper from 'timekeeper';

import TenantReducer from '../../app/reducers/tenantsReducer.js';
import {getTenants,requestTenants,recieveTenants,errorTenants,selectTenant} from '../../app/actions/tenants.js';

import * as types from '../../app/actions/types.js';

const mockStore = configureMockStore([ thunk ]);

var time = new Date(1);

describe('(Reducer) Tenants', () => {

    const managerData = {
        version: 'v3',
        ip: '10.10.10.10',
        auth: {
            isSecured: true,
            token: 'aaa'
        }
    };

    afterEach(() => {
        nock.cleanAll()
    });

    before(()=>{
        timeKeeper.freeze(time);
    });

    after(()=>{
        timeKeeper.reset();
    });

    it('creates success action when fetching tenants has been done', () => {
        nock('http://myhost:8088')
            .get(/sp*/)
            .reply(200, {items: [{name:'aaa'},{name:'bbb'},{name:'ccc'}] } );

        const expectedActions = [
            { type: types.REQ_TENANTS },
            { type: types.RES_TENANTS, tenants: {items: [{name:'aaa'},{name:'bbb'},{name:'ccc'}]},receivedAt: Date.now()  }
        ];

        const store = mockStore({});

        return store.dispatch(getTenants(managerData))
            .then(() => { // return of async actions
                expect(store.getActions()).to.eql(expectedActions);
            })
    });

    it('creates error action when fetching tenants returns an error', () => {
        nock('http://myhost:8088')
            .get(/sp*/)
            .reply(500,{message: 'Error fetching tenants'});

        const expectedActions = [
            { type: types.REQ_TENANTS },
            { type: types.ERR_TENANTS, error: 'Error fetching tenants',receivedAt: Date.now()  }
        ];

        const store = mockStore({});
        store.replaceReducer(TenantReducer);

        return store.dispatch(getTenants(managerData))
            .then(() => { // return of async actions
                expect(store.getActions()).to.eql(expectedActions);
            })
    });

    it('Store has an error if fetch tenants produces an error', () => {
        nock('http://myhost:8088')
            .get(/sp*/)
            .reply(500,{message: 'Error fetching tenants'});

        const store = createStore(TenantReducer,{},applyMiddleware(thunk));

        return store.dispatch(getTenants(managerData))
            .then(() => { // return of async actions
                expect(store.getState()).to.eql({
                    isFetching: false,
                    error: 'Error fetching tenants',
                    items: [],
                    lastUpdated: Date.now()
                });
            })
    });

    it('store has success and tenants data if fetch tenants is ok', () => {
        nock('http://myhost:8088')
            .get(/sp*/)
            .reply(200, {items: [{name:'aaa'},{name:'bbb'},{name:'ccc'}] } );

        const store = createStore(TenantReducer,{},applyMiddleware(thunk));

        return store.dispatch(getTenants(managerData))
            .then(() => { // return of async actions
                expect(store.getState()).to.eql({
                    isFetching: false,
                    items: [{name:'aaa'},{name:'bbb'},{name:'ccc'}],
                    selected: 'aaa',
                    lastUpdated: Date.now()
                });
            })
    });

    it('should handle selectTenant', () => {
        expect(TenantReducer({}, selectTenant('abc'))).to.eql({
            selected: 'abc'
        });
    });

});