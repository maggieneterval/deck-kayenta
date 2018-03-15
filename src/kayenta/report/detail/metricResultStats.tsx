import * as React from 'react';
import { round } from 'lodash';
import { connect } from 'react-redux';

import { ICanaryAnalysisResultsStats } from 'kayenta/domain';
import { ICanaryExecutionStatusResult } from 'kayenta/domain/ICanaryExecutionStatusResult';
import { ICanaryMetricConfig } from 'kayenta/domain/ICanaryConfig';
import { IMetricSetPair } from 'kayenta/domain/IMetricSetPair';
import { runSelector, selectedMetricConfigSelector } from 'kayenta/selectors';
import { ICanaryState } from 'kayenta/reducers';
import metricStoreConfigStore from 'kayenta/metricStore/metricStoreConfig.service';
import FormattedDate from 'kayenta/layout/formattedDate';

import './metricResultStats.less';


export interface IMetricResultStatsStateProps {
  metricConfig: ICanaryMetricConfig;
  metricSetPair: IMetricSetPair;
  run: ICanaryExecutionStatusResult;
  service: string;
}

const getStats = (run: ICanaryExecutionStatusResult, id: string, target: string): ICanaryAnalysisResultsStats => {
  const result = run.result.judgeResult.results.find(r => r.id === id);
  if (target === 'experiment') {
    return result.experimentMetadata.stats;
  } else if (target === 'control') {
    return result.controlMetadata.stats;
  } else {
    return null;
  }
};

interface IResultMetadataTableColumn {
  label: string;
  getValue: (target: string) => JSX.Element;
  hide?: () => boolean;
}

const ResultMetadataTable = ({ tableColumns }: { tableColumns: IResultMetadataTableColumn[] }) => {
  return (
    <section className="horizontal">
      <ul className="list-unstyled flex-1">
        <li>&nbsp;</li>
        <li>Baseline</li>
        <li>Canary</li>
      </ul>
      {
        tableColumns.map(column => {
          if (column.hide && column.hide()) {
            return null;
          }

          return (
            <ul className="list-unstyled flex-1" key={column.label}>
              <li className="uppercase label color-text-primary">
                {column.label}
              </li>
              <li>{column.getValue('control')}</li>
              <li>{column.getValue('experiment')}</li>
            </ul>
          );
        })
      }
    </section>
  );
};

interface IResultMetadataRow {
  label: string;
  getContent: () => JSX.Element;
}

const ResultMetadataRow = ({ row }: { row: IResultMetadataRow }) => {
  if (!row.getContent()) {
    return null;
  }

  return (
    <div>
      <label className="label uppercase color-text-primary">{row.label}</label>
      {row.getContent()}
    </div>
  );
};

const MetricResultStats = ({ metricConfig, metricSetPair, run }: IMetricResultStatsStateProps) => {
  const tableColumns: IResultMetadataTableColumn[] = [
    {
      label: 'start',
      getValue: target => <FormattedDate dateIso={metricSetPair.scopes[target].startTimeIso}/>,
      hide: () => {
        const configuredControlStart =
          run.result.canaryExecutionRequest.scopes[metricConfig.scopeName].controlScope.start;
        const actualControlStart = metricSetPair.scopes.control.startTimeIso;

        const configuredExperimentStart =
          run.result.canaryExecutionRequest.scopes[metricConfig.scopeName].experimentScope.start;
        const actualExperimentStart = metricSetPair.scopes.experiment.startTimeIso;

        return configuredControlStart === actualControlStart
          && configuredExperimentStart === actualExperimentStart;
      },
    },
    {
      label: 'count',
      getValue: target => <span>{getStats(run, metricSetPair.id, target).count}</span>,
    },
    {
      label: 'avg',
      getValue: target => <span>{round(getStats(run, metricSetPair.id, target).mean, 2)}</span>,
    },
    {
      label: 'max',
      getValue: target => <span>{round(getStats(run, metricSetPair.id, target).max, 2)}</span>,
    },
    {
      label: 'min',
      getValue: target => <span>{round(getStats(run, metricSetPair.id, target).min, 2)}</span>,
    },
  ];

  const metadataRows: IResultMetadataRow[] = [
    {
      label: 'name',
      getContent: () => <p>{metricConfig.name}</p>,
    },
    {
      label: 'query',
      getContent: () => (
        <p>
          {metricStoreConfigStore.getDelegate(metricConfig.query.type).queryFinder(metricConfig)}
        </p>
      ),
    },
    {
      label: 'classification reason',
      getContent: () => {
        const result =
          run.result.judgeResult.results.find(r => r.id === metricSetPair.id);

        if (!result.classificationReason) {
          return null;
        }

        return (
          <p>{result.classificationReason}</p>
        );
      },
    }
  ];

  return (
    <section className="metric-stats">
      {
        metadataRows.map(row => (
          <ResultMetadataRow row={row} key={row.label}/>
        ))
      }
      <ResultMetadataTable tableColumns={tableColumns}/>
    </section>
  );
};

const mapStateToProps = (state: ICanaryState): IMetricResultStatsStateProps => ({
  metricConfig: selectedMetricConfigSelector(state),
  metricSetPair: state.selectedRun.metricSetPair.pair,
  run: runSelector(state),
  service: selectedMetricConfigSelector(state).query.type
});

export default connect(mapStateToProps)(MetricResultStats);