/**
 * Created by pposel on 24/02/2017.
 */

const _ = require('lodash');
const os = require('os');
const fs = require('fs-extra');
const pathlib = require('path');
const yaml = require('js-yaml');

const config = require('../config').get();
const ArchiveHelper = require('./ArchiveHelper');
const Utils = require('../utils');

const logger = require('./LoggerHandler').getLogger('SourceHandler');

const browseSourcesDir = pathlib.join(os.tmpdir(), config.app.source.browseSourcesDir);
const lookupYamlsDir = pathlib.join(os.tmpdir(), config.app.source.lookupYamlsDir);

module.exports = (function() {
    function browseArchiveTree(req) {
        const archiveUrl = `/blueprints/${req.params.blueprintId}/archive`;
        logger.debug('download archive from url', archiveUrl);

        const archiveFolder = pathlib.join(browseSourcesDir, `source${Date.now()}`);
        return ArchiveHelper.removeOldExtracts(browseSourcesDir)
            .then(() => ArchiveHelper.saveDataFromUrl(archiveUrl, archiveFolder, req))
            .then(data => {
                const archivePath = pathlib.join(data.archiveFolder, data.archiveFile);
                const extractedDir = pathlib.join(data.archiveFolder, 'extracted');

                return ArchiveHelper.decompressArchive(archivePath, extractedDir).then(() =>
                    _scanArchive(extractedDir)
                );
            });
    }

    function browseArchiveFile(path) {
        return new Promise((resolve, reject) => {
            const absolutePath = pathlib.resolve(browseSourcesDir, path);
            if (!_checkPrefix(absolutePath, browseSourcesDir)) {
                return reject('Wrong path');
            }

            fs.readFile(absolutePath, 'utf-8', (err, data) => {
                if (err) {
                    return reject(err);
                }

                resolve(data);
            });
        });
    }

    function _checkPrefix(absCandidate, absPrefix) {
        return absCandidate.substring(0, absPrefix.length) === absPrefix;
    }

    function _saveMultipartData(req) {
        const targetPath = pathlib.join(lookupYamlsDir, `archive${Date.now()}`);
        return ArchiveHelper.saveMultipartData(req, targetPath, 'archive');
    }

    function _saveDataFromUrl(archiveUrl) {
        const targetPath = pathlib.join(lookupYamlsDir, `archive${Date.now()}`);
        return ArchiveHelper.saveDataFromUrl(archiveUrl, targetPath);
    }

    function _convertYamlToJson(path, yamlFile) {
        let yamlFilePath = '';

        let files = fs.readdirSync(path);
        if (_.includes(files, yamlFile)) {
            yamlFilePath = pathlib.resolve(path, yamlFile);
        } else if (files.length === 1 && fs.statSync(pathlib.join(path, files[0])).isDirectory()) {
            const directory = files[0];
            files = fs.readdirSync(pathlib.join(path, directory));
            if (_.includes(files, yamlFile)) {
                yamlFilePath = pathlib.resolve(path, directory, yamlFile);
            }
        }

        if (!_.isEmpty(yamlFilePath)) {
            try {
                const json = yaml.safeLoad(fs.readFileSync(yamlFilePath, 'utf8'));
                return Promise.resolve(json);
            } catch (error) {
                const errorMessage = `Cannot parse YAML file ${yamlFile}. Error: ${error}`;
                logger.error(errorMessage);
                return Promise.reject(errorMessage);
            }
        } else {
            return Promise.reject(`Cannot find YAML file ${yamlFile} in specified directory.`);
        }
    }

    function _getInputs(inputs) {
        return _.mapValues(inputs, inputObject => inputObject || {});
    }

    function _getPlugins(imports) {
        const PLUGIN_KEYWORD = 'plugin:';

        return _.chain(imports)
            .filter(imp => String(imp).match(PLUGIN_KEYWORD))
            .map(plugin => {
                const [package_name, pluginQueryString] = _.chain(plugin)
                    .replace(PLUGIN_KEYWORD, '')
                    .split('?')
                    .value();

                const params = Utils.getParams(pluginQueryString);
                const pluginObject = { package_name, params };

                return pluginObject;
            })
            .reduce((result, pluginObject) => {
                result[pluginObject.package_name] = _.omit(pluginObject, 'package_name');
                return result;
            }, {})
            .value();
    }

    function _getSecrets(json) {
        const SECRET_KEYWORD = 'get_secret';

        return _.chain(Utils.getValuesWithPaths(json, SECRET_KEYWORD))
            .reduce((result, value) => {
                const secretName = _.keys(value)[0];
                const secretPath = value[secretName];

                if (_.isUndefined(result[secretName])) {
                    result[secretName] = {};
                }

                (result[secretName].paths || (result[secretName].paths = [])).push(secretPath);

                return result;
            }, {})
            .value();
    }

    function _getBlueprintArchiveContent(request) {
        const { query } = request;
        const promise = query.url ? _saveDataFromUrl(query.url) : _saveMultipartData(request);

        return promise.then(data => {
            const { archiveFolder } = data;
            const { archiveFile } = data; // filename with extension
            const archiveFileName = pathlib.parse(archiveFile).name; // filename without extension
            const extractedDir = pathlib.join(archiveFolder, 'extracted');

            return ArchiveHelper.removeOldExtracts(lookupYamlsDir)
                .then(() => {
                    if (_.isEmpty(archiveFile)) {
                        throw 'No archive file provided';
                    } else {
                        const archivePath = pathlib.join(archiveFolder, archiveFile);
                        const archiveExtension = pathlib.parse(archiveFile).ext; // file extension

                        if (archiveExtension === '.yml' || archiveExtension === '.yaml') {
                            return ArchiveHelper.storeSingleYamlFile(archivePath, archiveFile, extractedDir);
                        }
                        return ArchiveHelper.decompressArchive(archivePath, extractedDir);
                    }
                })
                .then(decompressData => ({ archiveFileName, extractedDir, decompressData }))
                .catch(err => {
                    ArchiveHelper.cleanTempData(archiveFolder);
                    throw err;
                });
        });
    }

    function getBlueprintResources(request) {
        const { query } = request;
        const { yamlFile } = query;

        return _getBlueprintArchiveContent(request)
            .then(data => _convertYamlToJson(data.extractedDir, yamlFile))
            .then(json => ({
                inputs: _getInputs(json.inputs),
                dataTypes: json.data_types,
                plugins: _getPlugins(json.imports),
                secrets: _getSecrets(json)
            }));
    }

    function listYamlFiles(request) {
        const { query } = request;
        const includeFilename = query.includeFilename === 'true';
        let archiveFileName = '';

        return _getBlueprintArchiveContent(request)
            .then(data => {
                archiveFileName = data.archiveFileName;
                return _scanYamlFiles(data.extractedDir);
            })
            .then(data => (includeFilename ? [archiveFileName, ...data] : data));
    }

    function _scanYamlFiles(extractedDir) {
        logger.debug('scaning yaml files from', extractedDir);

        let items = fs.readdirSync(extractedDir);

        if (items.length === 1 && fs.statSync(pathlib.join(extractedDir, items[0])).isDirectory()) {
            items = fs.readdirSync(pathlib.join(extractedDir, items[0]));
        }

        items = _.filter(items, item => item.endsWith('.yaml'));

        return Promise.resolve(items);
    }

    function _scanArchive(archivePath) {
        logger.debug('scaning archive', archivePath);
        return _scanRecursive(browseSourcesDir, archivePath);
    }

    function _isUnixHiddenPath(path) {
        return /(^|.\/)\.+[^\/\.]/g.test(path);
    }

    function _scanRecursive(root, archivePath) {
        const stats = fs.statSync(archivePath);
        const name = pathlib.basename(archivePath);

        if (stats.isSymbolicLink() || _isUnixHiddenPath(name)) {
            return null;
        }

        const item = {
            key: archivePath.replace(pathlib.join(root, pathlib.sep), ''),
            title: name,
            isDir: false
        };

        if (stats.isFile()) {
            return item;
        }
        if (stats.isDirectory()) {
            try {
                const children = fs
                    .readdirSync(archivePath)
                    .map(child => _scanRecursive(root, pathlib.join(archivePath, child)))
                    .filter(e => !!e);

                item.isDir = true;
                item.children = _.sortBy(children, i => !i.isDir);

                return item;
            } catch (ex) {
                if (ex.code === 'EACCES') {
                    // User does not have permissions, ignore directory
                    return null;
                }
            }
        } else {
            return null;
        }
    }

    return {
        browseArchiveTree,
        browseArchiveFile,
        getBlueprintResources,
        listYamlFiles
    };
})();
