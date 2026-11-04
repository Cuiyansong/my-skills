import { useForm } from 'react-hook-form';

function ContactForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = (data) => {
    console.log(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email', { required: 'Email is required' })} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input {...register('password', { minLength: 8 })} />
      {errors.password && <span>Password must be at least 8 characters</span>}
      
      <button type="submit">Submit</button>
    </form>
  );
}

export default ContactForm;