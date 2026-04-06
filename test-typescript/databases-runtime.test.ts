/*
 * Copyright (c) 2015-2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.
 */

/// <reference path="../marklogic.d.ts" />

/**
 * TypeScript runtime test to validate the databases.list() and databases.read()
 * endpoints. These tests make real calls to the MarkLogic Manage API and verify
 * the output shape matches the TypeScript definitions.
 *
 * The client must connect to the manage port (8002) with admin credentials.
 *
 * Run with: npm run test:compile && npx mocha test-typescript/databases-runtime.test.js
 */

const should = require('should');
const marklogic = require('..');
const testconfig = require('../etc/test-config-qa.js');

// Type aliases for easier reference
type ResultProvider<T> = import('marklogic').ResultProvider<T>;
type DatabaseListItem = import('marklogic').DatabaseListItem;
type DatabaseClient = import('marklogic').DatabaseClient;
type DatabaseClientConfig = import('marklogic').DatabaseClientConfig;

const manageConfig: DatabaseClientConfig = {
  host:     testconfig.manageAdminConnection.host,
  port:     testconfig.manageAdminConnection.port,
  user:     testconfig.manageAdminConnection.user,
  password: testconfig.manageAdminConnection.password,
  authType: testconfig.manageAdminConnection.authType
};

const db: DatabaseClient = marklogic.createDatabaseClient(manageConfig);

describe('databases API runtime validation', function() {
  this.timeout(10000);

  after(function(done) {
    db.release();
    done();
  });

  describe('databases.list()', function() {

    it('should return a ResultProvider with .result() method', function() {
      const resultProvider: ResultProvider<DatabaseListItem[]> = db.databases.list();

      should(resultProvider).have.property('result');
      should(resultProvider.result).be.a.Function();
    });

    it('should resolve to an array of DatabaseListItem objects', async function() {
      const databases: DatabaseListItem[] = await db.databases.list().result();

      should(databases).be.an.Array();
      databases.length.should.be.greaterThan(0);

      // Verify each item has the expected shape from the outputTransform
      const first = databases[0];
      console.log("*************");
      console.log(databases.length);
      should(first).have.property('nameref');
      should(first).have.property('uriref');
      should(first).have.property('idref');
      should(first.nameref).be.a.String();
      should(first.uriref).be.a.String();
      should(first.idref).be.a.String();
      for(let i=0; i<databases.length; i++){
        console.log(databases[i]);
      }
    });

    it('should include well-known system databases', async function() {
      const databases: DatabaseListItem[] = await db.databases.list().result();

      const names = databases.map((item: DatabaseListItem) => item.nameref);

      // Every MarkLogic installation has these databases
      names.should.containEql('Security');
      names.should.containEql('Schemas');
    });

    it('should work with callback-style .result()', function(done) {
      db.databases.list().result(
        function(databases: DatabaseListItem[]) {
          should(databases).be.an.Array();
          databases.length.should.be.greaterThan(0);
          databases[0].should.have.property('nameref');
          done();
        },
        done
      );
    });
  });

  describe('databases.read()', function() {

    it('should return a ResultProvider with .result() method', function() {
      const resultProvider: ResultProvider<any> = db.databases.read('Security');

      should(resultProvider).have.property('result');
      should(resultProvider.result).be.a.Function();
    });

    it('should resolve to database detail for a known database', async function() {
      const detail: any = await db.databases.read('Security').result();

      should(detail).be.an.Object();
      should(detail).not.be.empty();
    });

    it('should throw when called without a database name', function() {
      should(function() {
        (db.databases as any).read(null);
      }).throw(/cannot read database without a name or id/);
    });
  });
});
