const MainApp = require("../src/activityFeedFilter.user").MainApp;
const sinon = require('sinon');
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');

const jsdom = new JSDOM('<!doctype html><html lang="en"><body></body></html>');
global.window = jsdom.window;
global.document = jsdom.window.document;
global.HTMLElement = jsdom.window.HTMLElement;

describe('MainApp', () => {
    let mainApp;
    let activityHandler;
    let uiHandler;

    beforeEach(() => {
        activityHandler = {
            processNode: sinon.spy(),
            resetLoadCount: sinon.spy(),
            currentLoadCount: 0,
        };

        uiHandler = {
            assignLoadMore: sinon.spy(),
            clickLoadMore: sinon.spy(),
            userPressed: true,
            resetState: sinon.spy(),
        };

        mainApp = new MainApp(activityHandler, uiHandler, {
            options: {
                targetLoadCount: 10,
            },
            runOn: {
                home: false,
                social: false,
                profile: false,
                guestHome: false,
            },
        });
    });

    describe('observeMutations', () => {
        it('should call handleAddedNode and loadMoreOrReset if URL is allowed', () => {
            const mutations = [{ addedNodes: [document.createElement('div')] }];
            const isAllowedUrlStub = sinon.stub(mainApp, 'isAllowedUrl').returns(true);
            const handleAddedNodeSpy = sinon.spy(mainApp, 'handleAddedNode');
            const loadMoreOrResetSpy = sinon.spy(mainApp, 'loadMoreOrReset');

            mainApp.observeMutations(mutations);

            expect(isAllowedUrlStub.calledOnce).to.be.true;
            expect(handleAddedNodeSpy.calledOnce).to.be.true;
            expect(loadMoreOrResetSpy.calledOnce).to.be.true;

            isAllowedUrlStub.restore();
            handleAddedNodeSpy.restore();
            loadMoreOrResetSpy.restore();
        });

        it('should not call handleAddedNode and loadMoreOrReset if URL is not allowed', () => {
            const mutations = [{ addedNodes: [document.createElement('div')] }];
            const isAllowedUrlStub = sinon.stub(mainApp, 'isAllowedUrl').returns(false);
            const handleAddedNodeSpy = sinon.spy(mainApp, 'handleAddedNode');
            const loadMoreOrResetSpy = sinon.spy(mainApp, 'loadMoreOrReset');

            mainApp.observeMutations(mutations);

            expect(isAllowedUrlStub.calledOnce).to.be.true;
            expect(handleAddedNodeSpy.called).to.be.false;
            expect(loadMoreOrResetSpy.called).to.be.false;

            isAllowedUrlStub.restore();
            handleAddedNodeSpy.restore();
            loadMoreOrResetSpy.restore();
        });
    });

    describe('handleAddedNode', () => {
        it('should call ac.processNode when an activity node is added', () => {
            const activityNode = document.createElement('div');
            activityNode.classList.add('activity-entry');

            mainApp.handleAddedNode(activityNode);

            expect(activityHandler.processNode.calledOnce).to.be.true;
        });

        it('should call ui.assignLoadMore when a button node is added', () => {
            const buttonNode = document.createElement('div');
            buttonNode.classList.add('load-more');

            mainApp.handleAddedNode(buttonNode);

            expect(uiHandler.assignLoadMore.calledOnce).to.be.true;
        });

        it('should not call ac.processNode or ui.assignLoadMore for other node types', () => {
            const otherNode = document.createElement('div');

            mainApp.handleAddedNode(otherNode);

            expect(activityHandler.processNode.called).to.be.false;
            expect(uiHandler.assignLoadMore.called).to.be.false;
        });

        it('should process an activity entry when its markdown sub-node is added', () => {
            const entry = document.createElement('div');
            entry.classList.add('activity-entry');
            document.body.appendChild(entry);
            const markdown = document.createElement('div');
            markdown.classList.add('activity-markdown');
            entry.appendChild(markdown);

            mainApp.handleAddedNode(markdown);

            expect(activityHandler.processNode.calledOnce).to.be.true;
            expect(activityHandler.processNode.calledWith(entry)).to.be.true;
        });
    });

    describe('loadMoreOrReset', () => {
        it('should call ui.clickLoadMore if currentLoadCount < targetLoadCount and userPressed is true', () => {
            activityHandler.currentLoadCount = 5;
            uiHandler.userPressed = true;

            mainApp.loadMoreOrReset();

            expect(uiHandler.clickLoadMore.calledOnce).to.be.true;
        });

        it('should call ac.resetLoadCount and ui.resetLoadCount if currentLoadCount is equal to targetLoadCount and userPressed is true', () => {
            activityHandler.currentLoadCount = 10;
            uiHandler.userPressed = true;

            mainApp.loadMoreOrReset();

            expect(activityHandler.resetLoadCount.calledOnce).to.be.true;
            expect(uiHandler.resetState.calledOnce).to.be.true;
        });

        it('should call ac.resetLoadCount and ui.resetLoadCount if currentLoadCount >= config.targetLoadCount or userPressed is false', () => {
            activityHandler.currentLoadCount = 10;
            uiHandler.userPressed = false;

            mainApp.loadMoreOrReset();

            expect(activityHandler.resetLoadCount.calledOnce).to.be.true;
            expect(uiHandler.resetState.calledOnce).to.be.true;
        });
    });

    describe('isAllowedUrl', () => {
        const testUrls = [
            'https://anilist.co/home',
            'https://anilist.co/user/username/',
            'https://anilist.co/anime/social',
            'https://anilist.co/social',
        ];

        it('should return false for all URLs when all config values are false', () => {
            Object.keys(mainApp.config.runOn).forEach(key => {
                mainApp.config.runOn[key] = false;
            });

            testUrls.forEach(url => {
                global.window = { location: { href: url } };
                expect(mainApp.isAllowedUrl()).to.be.false;
            });
        });

        it('should return true for corresponding URLs when all config values are true', () => {
            Object.keys(mainApp.config.runOn).forEach(key => {
                mainApp.config.runOn[key] = true;
            });

            testUrls.forEach(url => {
                global.window = { location: { href: url } };
                expect(mainApp.isAllowedUrl()).to.be.true;
            });
        });
    });
});
