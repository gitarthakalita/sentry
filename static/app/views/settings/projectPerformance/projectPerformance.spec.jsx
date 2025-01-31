import {render, screen, userEvent} from 'sentry-test/reactTestingLibrary';

import * as utils from 'sentry/utils/isActiveSuperuser';
import ProjectPerformance from 'sentry/views/settings/projectPerformance/projectPerformance';

describe('projectPerformance', function () {
  const org = TestStubs.Organization({
    features: [
      'performance-view',
      'performance-issues-dev',
      'project-performance-settings-admin',
    ],
  });
  const project = TestStubs.ProjectDetails();
  const configUrl = '/projects/org-slug/project-slug/transaction-threshold/configure/';
  let getMock, postMock, deleteMock, performanceIssuesMock;

  beforeEach(function () {
    MockApiClient.clearMockResponses();
    getMock = MockApiClient.addMockResponse({
      url: configUrl,
      method: 'GET',
      body: {
        id: project.id,
        threshold: '300',
        metric: 'duration',
      },
      statusCode: 200,
    });
    postMock = MockApiClient.addMockResponse({
      url: configUrl,
      method: 'POST',
      body: {
        id: project.id,
        threshold: '400',
        metric: 'lcp',
      },
      statusCode: 200,
    });
    deleteMock = MockApiClient.addMockResponse({
      url: configUrl,
      method: 'DELETE',
      statusCode: 200,
    });
    MockApiClient.addMockResponse({
      url: '/projects/org-slug/project-slug/',
      method: 'GET',
      body: {},
      statusCode: 200,
    });
    performanceIssuesMock = MockApiClient.addMockResponse({
      url: '/projects/org-slug/project-slug/performance-issues/configure/',
      method: 'GET',
      body: {},
      statusCode: 200,
    });
  });

  it('renders the fields', function () {
    render(
      <ProjectPerformance
        params={{orgId: org.slug, projectId: project.slug}}
        organization={org}
        project={project}
      />
    );

    expect(
      screen.getByRole('textbox', {name: 'Response Time Threshold (ms)'})
    ).toHaveValue('300');

    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it('updates the field', async function () {
    render(
      <ProjectPerformance
        params={{orgId: org.slug, projectId: project.slug}}
        organization={org}
        project={project}
      />
    );

    const input = screen.getByRole('textbox', {name: 'Response Time Threshold (ms)'});

    await userEvent.clear(input);
    await userEvent.type(input, '400');
    await userEvent.tab();

    expect(postMock).toHaveBeenCalledWith(
      configUrl,
      expect.objectContaining({
        data: {threshold: '400'},
      })
    );

    expect(input).toHaveValue('400');
  });

  it('clears the data', async function () {
    render(
      <ProjectPerformance
        params={{orgId: org.slug, projectId: project.slug}}
        organization={org}
        project={project}
      />
    );

    await userEvent.click(screen.getByRole('button', {name: 'Reset All'}));
    expect(deleteMock).toHaveBeenCalled();
  });

  it('does not get performance issues settings without the feature flag', function () {
    const orgWithoutPerfIssues = TestStubs.Organization({
      features: ['performance-view', 'performance-issues-dev'],
    });

    render(
      <ProjectPerformance
        params={{orgId: org.slug, projectId: project.slug}}
        organization={orgWithoutPerfIssues}
        project={project}
      />
    );

    expect(performanceIssuesMock).not.toHaveBeenCalled();
  });

  it('renders detector threshold configuration - admin ui', async function () {
    jest.spyOn(utils, 'isActiveSuperuser').mockReturnValue(true);

    render(
      <ProjectPerformance
        params={{orgId: org.slug, projectId: project.slug}}
        organization={org}
        project={project}
      />,
      {organization: org}
    );

    expect(
      await screen.findByText('N+1 DB Queries Detection Enabled')
    ).toBeInTheDocument();
    expect(screen.getByText('Slow DB Queries Detection Enabled')).toBeInTheDocument();
    expect(screen.getByText('N+1 API Calls Detection Enabled')).toBeInTheDocument();
    expect(
      screen.getByText('Consecutive HTTP Spans Detection Enabled')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Consecutive DB Queries Detection Enabled')
    ).toBeInTheDocument();
    expect(screen.getByText('Large HTTP Payload Detection Enabled')).toBeInTheDocument();
    expect(screen.getByText('DB On Main Thread Detection Enabled')).toBeInTheDocument();
    expect(
      screen.getByText('File I/O on Main Thread Detection Enabled')
    ).toBeInTheDocument();
    expect(screen.getByText('Uncompressed Assets Detection Enabled')).toBeInTheDocument();
    expect(
      screen.getByText('Large Render Blocking Asset Detection Enabled')
    ).toBeInTheDocument();
  });
});
