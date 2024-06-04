import { ChainfileLogo } from './components/ChainfileLogo';

export default {
  logo: <ChainfileLogo height={12} />,
  project: {
    link: 'https://github.com/vetumorg/chainfile',
  },
  docsRepositoryBase: 'https://github.com/vetumorg/chainfile/tree/main/website',
  footer: {
    component: <></>,
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Chainfile',
    };
  },
};
