/*
* Copyright (c) 2015-2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.
*/
'use strict';
const requester = require('./requester.js');
const mlutil    = require('./mlutil.js');
const Operation = require('./operation.js');

/**
 * Provides functions to retrieve information about MarkLogic databases.
 * The client must have been created for a user with the manage-admin or
 * admin role, typically connecting to the manage port (8002).
 * @namespace databases
 */

/** @ignore */
function Databases(client) {
  if (!(this instanceof Databases)) {
    return new Databases(client);
  }
  this.client = client;
}

/**
 * Lists the databases on the MarkLogic server.
 * @method databases#list
 * @since 3.3.0
 * @returns {ResultProvider} an object whose result() function takes
 * a success callback that receives an array of database items, each
 * containing the database name and uri.
 */
Databases.prototype.list = function listDatabases() {
  const requestOptions = mlutil.copyProperties(this.client.getConnectionParams());
  requestOptions.method = 'GET';
  requestOptions.headers = {
      'Accept': 'application/json'
  };
  requestOptions.path = '/manage/v2/databases?format=json';

  const operation = new Operation(
      'list databases', this.client, requestOptions, 'empty', 'single'
      );
  operation.validStatusCodes = [200];
  operation.outputTransform  = listOutputTransform;

  return requester.startRequest(operation);
};

/** @ignore */
function listOutputTransform(headers, data) {
  /*jshint validthis:true */
  if (data == null) {
    return [];
  }

  const listResponse = data['database-default-list'] || data;
  const listItems = listResponse['list-items'];
  if (listItems == null) {
    return [];
  }

  const listItem = listItems['list-item'];
  if (!Array.isArray(listItem)) {
    return [];
  }

  return listItem.map(function(item) {
    return {
      nameref:  item.nameref,
      uriref:   item.uriref,
      idref:    item.idref
    };
  });
}

/**
 * Reads the details of a specific database by name or id.
 * @method databases#read
 * @since 3.3.0
 * @param {string} databaseId - the name or id of the database
 * @returns {ResultProvider} an object whose result() function takes
 * a success callback that receives the database properties.
 */
Databases.prototype.read = function readDatabase(databaseId) {
  if (databaseId == null) {
    throw new Error('cannot read database without a name or id');
  }

  const requestOptions = mlutil.copyProperties(this.client.getConnectionParams());
  requestOptions.method = 'GET';
  requestOptions.headers = {
      'Accept': 'application/json'
  };
  requestOptions.path = '/manage/v2/databases/' + encodeURIComponent(databaseId) + '?format=json';

  const operation = new Operation(
      'read database', this.client, requestOptions, 'empty', 'single'
      );
  operation.validStatusCodes = [200];

  return requester.startRequest(operation);
};

module.exports = Databases;
