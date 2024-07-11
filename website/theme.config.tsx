import { useConfig } from 'nextra-theme-docs';

import { ChainfileLogo } from './components/ChainfileLogo';

export default {
  logo: <ChainfileLogo height={12} />,
  project: {
    link: 'https://github.com/fuxingloh/chainfile',
  },
  docsRepositoryBase: 'https://github.com/fuxingloh/chainfile/tree/main/website',
  footer: {
    component: <></>,
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Chainfile',
    };
  },
  head: () => {
    const { frontMatter } = useConfig();
    return (
      <>
        <meta property="og:title" content={frontMatter.title || 'Chainfile'} />
        <meta
          property="og:description"
          content={
            'Chainfile is an open-source framework to define, test, deploy, and scale blockchain nodes on container-orchestration platforms.'
          }
        />
      </>
    );
  },
};
