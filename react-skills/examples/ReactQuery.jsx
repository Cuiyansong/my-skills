import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then(res => res.json())
  });
}

function useCreateTodo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newTodo) => fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(newTodo)
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });
}

export { useTodos, useCreateTodo };