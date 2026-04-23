import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Runner from "@/pages/Runner";
import Review from "@/pages/Review";
import Results from "@/pages/Results";
import History from "@/pages/History";
import Notes from "@/pages/Notes";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/exam/:examId" component={Runner} />
      <Route path="/review/:attemptId" component={Review} />
      <Route path="/results/:attemptId" component={Results} />
      <Route path="/history" component={History} />
      <Route path="/notes" component={Notes} />
      <Route path="/notes/:slug" component={Notes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
