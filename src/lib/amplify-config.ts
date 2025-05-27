import { Amplify } from 'aws-amplify';
import outputs from '../app/amplify-outputs.json';

Amplify.configure(outputs);

export default Amplify; 