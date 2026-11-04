import { useId } from 'react';

function Checkbox({ label, checked, onChange }) {
  const id = useId();

  return (
    <div>
      <input 
        id={id}
        type="checkbox" 
        checked={checked} 
        onChange={onChange}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

function PasswordField() {
  const passwordId = useId();
  const confirmId = useId();

  return (
    <div>
      <div>
        <label htmlFor={passwordId}>Password:</label>
        <input id={passwordId} type="password" />
      </div>
      <div>
        <label htmlFor={confirmId}>Confirm Password:</label>
        <input id={confirmId} type="password" />
      </div>
    </div>
  );
}

function Form() {
  return (
    <form>
      <h3>Sign Up</h3>
      <Checkbox label="I agree to the terms" checked={false} onChange={() => {}} />
      <PasswordField />
    </form>
  );
}

export default Form;
