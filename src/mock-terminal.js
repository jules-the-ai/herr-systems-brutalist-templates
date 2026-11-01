// Local-only demo: no shell, API, storage, or model calls.
const terminal = document.querySelector('.hero-terminal');
if (terminal) {
  const input = terminal.querySelector('input');
  const output = terminal.querySelector('.terminal-output');
  const history = [];
  let cursor = 0, draft = '';
  const services = [
    ['Web design', '/services/web-design/', 'Distinctive pages and clear, responsive layouts.'],
    ['Development', '/services/#development', 'Useful features, integrations, and maintainable code.'],
    ['Hosting', '/services/#hosting', 'A maintained home for your website.'],
    ['Agentic setups', '/services/#agentic-setups', 'Careful AI-assisted workflows with human oversight.'],
    ['Consulting', '/services/#consulting', 'Technical advice and a practical next step.'],
    ['Contract work', '/services/#contract-work', 'Extra design and development capacity.'],
  ];
  const pages = [
    ['Home', '/', 'You are here. Welcome in.'],
    ['Services', '/services/', 'Find the right kind of help.'],
    ['Work', '/case-studies/', 'Illustrative concept studies.'],
    ['Pricing', '/pricing/', '$70/hour, or a clearly scoped project.'],
    ['About', '/about/', 'People, principles, and how we work.'],
    ['Blog', '/blog/', 'Notes from the workshop.'],
    ['Contact', '/contact/', 'Tell us what you want to make easier.'],
  ];
  const routes = new Map([...pages, ...services].map(([name,url]) => [name.toLowerCase().replaceAll(' ', '-'), url]));
  routes.set('team', '/about/#team');
  const commands = ['herr -help','herr -services','herr -pages','herr -work','herr -pricing','herr -about','herr -contact','herr -blog','herr -team','herr -chat','herr -history','herr -clear','herr -coffee',...Array.from(routes.keys(), key => `herr -open ${key}`)];
  function paragraph(parent, text, css = '') {
    const p = document.createElement('p'); p.textContent = text; p.className = css; parent.append(p);
  }
  function links(parent, records) {
    const list = document.createElement('ul'); list.className = 'terminal-result-list';
    for (const [name,href,description] of records) {
      const li = document.createElement('li'), a = document.createElement('a');
      a.textContent = `${name} →`; a.href = href; li.append(a);
      if (description) {const small = document.createElement('small'); small.textContent = description; li.append(small);}
      list.append(li);
    }
    parent.append(list);
  }
  function append(entry) {
    output.append(entry);
    while(output.children.length > 40) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
  }
  function chat(message) {
    const q = message.toLowerCase();
    if(!message) return 'Try herr -chat "I need a website". These are local, scripted replies—not a connected AI assistant.';
    if(/price|pricing|cost|rate|budget/.test(q)) return 'Start with $70/hour. A well-defined project can be priced as a scope instead. Try herr -pricing for the estimator: a starting point, not a final quote.';
    if(/automat|agent|\bai\b|repeat|workflow/.test(q)) return 'A useful first automation is one repetitive task with a clear input and a human checkpoint. Think draft preparation, intake sorting, or connecting two tools. Try herr -services for agentic setups and development.';
    if(/host|backup|maintain|maintenance/.test(q)) return 'A website needs a dependable home as well as good design. Think updates, backups, and knowing where to turn for help. Try herr -services to explore hosting.';
    if(/design|website|web site|redesign|mobile|retro/.test(q)) return 'Start with the job your website needs to do: explain a service, show your work, or help people get in touch. A clear homepage and one strong reusable page template go a long way. Try herr -open web-design.';
    if(/human|contact|email|talk|hire/.test(q)) return 'Absolutely. No robot gatekeeping here. Try herr -contact for the real contact page and tell the team what you have in mind.';
    if(/hello|\bhi\b|hey|howdy/.test(q)) return 'Hey, curious human. I’m the scripted demo guide—not the future live AI just yet. Try herr -chat "your question" about websites, hosting, automation, or pricing.';
    return 'That is beyond my tiny scripted brain. A future connected assistant could take it further. Try a website, pricing, hosting, or automation question—or herr -contact for the team.';
  }
  function run(raw) {
    const command = raw.trim().slice(0,300); if(!command) return;
    if(history.at(-1) !== command) history.push(command);
    if(history.length > 50) history.shift();
    cursor = history.length; draft = ''; input.value = '';
    const entry = document.createElement('div'); entry.className = 'terminal-entry';
    paragraph(entry, `$ ${command}`, 'terminal-echo');
    const match = command.match(/^herr(?:\s+(-{1,2}[a-z-]+))?(?:\s+([\s\S]*))?$/i);
    let flag = match ? (match[1]?.toLowerCase().replace(/^--/,'-') || '-help') : '-unknown';
    let arg = (match?.[2] || '').trim();
    for(const quote of ['"', "'"]) if(arg.startsWith(quote)) if(arg.endsWith(quote)) arg = arg.slice(1,-1);
    if(command.toLowerCase() === 'clear') flag = '-clear';
    if(command.toLowerCase() === 'help') flag = '-help';
    switch(flag) {
      case '-help':
        paragraph(entry, 'A small command line for a more useful web.', 'terminal-reply-title');
        for(const text of [
          'herr -services → Our six services', 'herr -pages → The whole site, in one map',
          'herr -work → Concept case studies', 'herr -pricing → Rates and estimator',
          'herr -about → People and principles', 'herr -contact → Start a conversation',
          'herr -blog → Notes from the workshop', 'herr -team → Demo staff profiles',
          'herr -open name → Go to a page (try web-design)', 'herr -chat text → Ask the scripted demo guide',
          'herr -history → Recent commands', 'clear → Clear this screen',
        ]) paragraph(entry,text);
        paragraph(entry,'↑↓ recalls commands. Tab completes a unique match. No real shell commands run here.');
        break;
      case '-services':
        paragraph(entry, 'Six ways to make the web work for you.', 'terminal-reply-title'); links(entry,services);
        paragraph(entry,'Click a service, or type herr -open web-design.'); break;
      case '-pages': paragraph(entry,'Site map / choose your next stop','terminal-reply-title'); links(entry,pages); break;
      case '-about':
        paragraph(entry,'Small team. Human connection. Thoughtful design, dependable development, and technology with a clear purpose.','terminal-reply-title');
        links(entry,[['Meet Herr Systems','/about/'],['Meet the demo team','/about/#team']]); break;
      case '-work':
        paragraph(entry,'Concept studies—not claims of completed client work.','terminal-reply-title');
        links(entry,[['Maple Street Workshop','/case-studies/maple-street-workshop/','Service-led website concept.'],['Fieldnote Operations','/case-studies/fieldnote-operations/','Human-reviewed intake workflow concept.'],['Northline Community','/case-studies/northline-community/','Community-site concept.']]); break;
      case '-pricing':
        paragraph(entry,'$70 / hour. Clear scope. No surprises.','terminal-reply-title');
        paragraph(entry,'For a defined project, scoped pricing can work out lower than the equivalent hourly total. Agree on scope and price before work begins.');
        links(entry,[['Explore pricing and build an estimate','/pricing/']]); break;
      case '-contact':
        paragraph(entry,'Got an old website, a new idea, or a pile of tasks that should be easier?','terminal-reply-title');
        links(entry,[['Start a conversation','/contact/']]);
        paragraph(entry,'This terminal does not collect or send inquiries. Use the contact page when you are ready.'); break;
      case '-blog': links(entry,[['Notes from the workshop','/blog/']]); break;
      case '-team':
        paragraph(entry,'Meet the fictional demo profiles.','terminal-reply-title');
        links(entry,[['Alex Morgan','/about/team/alex-morgan/','Design and Strategy'],['Sam Rivera','/about/team/sam-rivera/','Development and systems'],['Jordan Ellis','/about/team/jordan-ellis/','Client care and projects']]); break;
      case '-chat': paragraph(entry,'HERR GUIDE / scripted demo','terminal-reply-title'); paragraph(entry,chat(arg)); break;
      case '-history': history.slice(-10).forEach((text,index) => paragraph(entry,`${index+1}  ${text}`)); break;
      case '-clear': output.replaceChildren(); paragraph(entry,'Fresh screen. Same useful humans. Try herr -help.'); break;
      case '-open': {
        const target = routes.get(arg.toLowerCase());
        if(target) {paragraph(entry,`Opening ${arg}…`); append(entry); window.location.assign(target); return;}
        paragraph(entry,'Unknown destination. Try herr -pages or herr -open web-design. Only known site pages can be opened.','terminal-error'); break;
      }
      case '-coffee': paragraph(entry,'☕ Coffee is a human-powered dependency. While it brews, try herr -services.'); break;
      default: paragraph(entry,'Command not found. Try herr -help. This is a mock terminal, not a system shell.','terminal-error');
    }
    append(entry);
  }
  terminal.querySelector('form').addEventListener('submit', event => {event.preventDefault(); run(input.value);});
  terminal.querySelectorAll('[data-terminal-command]').forEach(button => button.addEventListener('click', () => run(button.dataset.terminalCommand)));
  input.addEventListener('keydown', event => {
    if(event.isComposing) return;
    if(event.key === 'ArrowUp') {
      event.preventDefault(); if(cursor === history.length) draft = input.value;
      cursor = Math.max(0,cursor-1); input.value = history[cursor] || draft;
      input.setSelectionRange(input.value.length,input.value.length);
    } else if(event.key === 'ArrowDown') {
      event.preventDefault(); cursor = Math.min(history.length,cursor+1);
      input.value = cursor === history.length ? draft : history[cursor];
      input.setSelectionRange(input.value.length,input.value.length);
    } else if(event.key === 'Tab') {
      if(!event.shiftKey) if(input.value.trim()) {
        const matches = commands.filter(c => c.startsWith(input.value.trim().toLowerCase()));
        if(matches.length === 1) if(matches[0] !== input.value.trim().toLowerCase()) {event.preventDefault(); input.value = `${matches[0]} `;}
      }
    } else if(event.key === 'Escape') {input.value = ''; draft = ''; cursor = history.length;}
  });
  terminal.querySelectorAll('button, input').forEach(control => {control.disabled = false;});
}
