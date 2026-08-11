import { useMutation } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { askMemory } from '../services/api';

export function MemoryPage() {
  const [query, setQuery] = useState('What was my previous fintech startup idea?');
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState([]);
  const mutation = useMutation({
    mutationFn: askMemory,
    onSuccess: (data) => {
      setAnswer(data.answer || '');
      setResults(data.results || []);
    }
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header>
        <h1 className="text-3xl font-semibold text-ink">RAG Memory</h1>
        <p className="mt-1 text-sm text-slate-500">Search generated reports and historical projects with semantic-style retrieval.</p>
      </header>
      <section className="panel rounded-md p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input className="h-10 rounded-md border border-line px-3 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button onClick={() => mutation.mutate(query)} disabled={mutation.isPending}>
            <Search size={16} />
            Ask
          </Button>
        </div>
      </section>
      {mutation.error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{mutation.error.response?.data?.message || mutation.error.message}</p> : null}
      {answer ? (
        <section className="panel rounded-md p-5">
          <h2 className="text-lg font-semibold">Answer</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{answer}</p>
        </section>
      ) : null}
      <section className="space-y-3">
        {results.length ? <h2 className="text-lg font-semibold">Sources</h2> : null}
        {results.map((result) => (
          <article key={result._id} className="rounded-md border border-line bg-white p-4">
            <p className="text-sm font-semibold">{result.title}</p>
            <p className="mt-2 text-sm text-slate-600">{result.snippet}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
