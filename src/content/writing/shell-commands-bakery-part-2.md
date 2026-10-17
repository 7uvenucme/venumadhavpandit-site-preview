---
title: "Shell commands explained like you're 5: the bakery edition (Part 2)"
summary: "Part 1 set up the kitchen: getting into the server, finding your way around, and putting your code on it. Part 2 opens the shop: starting a program so it keeps running after you hang up, reading its diary when it misbehaves, and fixing the problems you will actually meet."
date: "2026-10-18"
image: "/images/shell-bakery-part-2-header.webp"
imageAlt: "A brass kettle steaming beside a cup of chai on a wooden table in warm evening light"
---

## The bakery, in one paragraph

A quick recap of the mapping from [Part 1](https://www.venumadhavpandit.com/writing/shell-commands-bakery-part-1/). The server is a bakery across town and SSH is the phone line into it. Code is the recipe, a running program is a baker following it, logs are the shift diary, and folders are shelves. This part adds two more: PM2 is the shift manager who keeps a baker on shift even when you go home, and a lock file is a "baker working" sign hung on the oven.

Same deal as Part 1: a Linux server, made up names and paths, and each command shown with what its name stands for, what it means in the bakery, what it does on the server, and when you would use it.

## Open the shop (run it and look after it)

The recipe is in place and the ingredients arrived. Now put a baker to work, keep them working after you leave, and learn to read what they write down.

```sh
node app.js
```

**Name stands for:** node = the Node.js program that runs JavaScript

**In the bakery:** You personally stand at the oven and do the baking yourself.

**On the server:** Runs a JavaScript program directly. It stops when you close the terminal or press Ctrl+C.

**Use it when:** To try something once. For anything that has to keep running after you leave, hand it to a manager like PM2 below.

```sh
pm2 start app.js --name bakery-app
```

**Name stands for:** pm2 = Process Manager 2

**In the bakery:** Hire a shift manager. They put a baker on the job, restart them if they faint, and keep working after you go home.

**On the server:** Starts the program under PM2, with a name you pick (here bakery-app). PM2 runs it in the background and restarts it if it crashes. PM2 is an extra tool you install, not something every server has.

**Use it when:** For programs that must stay up. Name them so you can refer to them later.

```sh
pm2 list
pm2 pid bakery-app
```

**Name stands for:** list = show all; pid = Process ID

**In the bakery:** The shift whiteboard: who is on shift, since when, and are they still on their feet. pid is the baker's staff number.

**On the server:** pm2 list shows every program PM2 manages with its status and restart count. pm2 pid prints the process ID of one.

**Use it when:** First check whenever something feels off. But "online" only means the baker is present, not that bread is coming out.

```sh
pm2 logs bakery-app --lines 50
```

**Name stands for:** logs = the program's diary

**In the bakery:** Read the last 50 lines of the shift diary.

**On the server:** Shows what the program has been printing, with times. --lines 50 limits it to the last 50 lines.

**Use it when:** Whenever you wonder "what is it actually doing?". Logs may contain private information, so be careful what you share.

```sh
head -n 20 app.log
tail -n 50 app.log
```

**Name stands for:** head = the top of a file; tail = the end; -n = Number of lines

**In the bakery:** Read only the first 20 or the last 50 lines of the diary instead of the whole book.

**On the server:** Prints the beginning or the end of a file.

**Use it when:** For long files. The end of a log is usually the most useful part, because it is the newest.

```sh
tail -f app.log
```

**Name stands for:** -f = Follow

**In the bakery:** Stand behind the baker and watch the diary fill in live.

**On the server:** Keeps the file open and prints new lines as they arrive.

**Use it when:** To watch something happen in real time. It looks stuck because it is waiting for new lines. Press Ctrl+C to stop watching. That stops the viewer, not the program.

```sh
grep "error" app.log
```

**Name stands for:** grep = Global Regular Expression Print

**In the bakery:** Flip through the diary and highlight only the lines that mention a problem.

**On the server:** Prints only the lines of a file that contain the word you gave it.

**Use it when:** To find a needle in a long log. Add -i to ignore upper and lower case.

```sh
pm2 stop bakery-app
pm2 restart bakery-app
```

**Name stands for:** stop = pause; restart = stop then start again

**In the bakery:** Send the baker home, or send them home and call them straight back in.

**On the server:** Stops the program, or restarts it so it re-reads code and settings from disk.

**Use it when:** After you deployed new code, so the running program uses it. Not a first step for every problem.

```sh
pm2 save
```

**Name stands for:** save = remember the list

**In the bakery:** Write the staff roster in a notebook.

**On the server:** Saves the current list of PM2 programs. By itself it does not make them start after a reboot, that needs extra PM2 startup setup.

**Use it when:** After setting up programs the way you want them.

```sh
ps -p 12345 -o pid,lstart,args
```

**Name stands for:** ps = Process Status; -p = this Process; -o = Output columns; lstart = Long START time

**In the bakery:** Ask "is baker number 12345 actually in the building, and since when?"

**On the server:** Shows facts about one running process by its ID.

**Use it when:** To check whether a particular process is alive.

```sh
top
```

**Name stands for:** top = the busiest programs on top (no acronym)

**In the bakery:** A live dashboard of which baker or oven is using the most energy.

**On the server:** A live view of running programs, sorted by how much CPU and memory they use. Press q to quit.

**Use it when:** When the server feels slow.

```sh
kill 12345
```

**Name stands for:** kill = ask a process to stop

**In the bakery:** Politely tell baker 12345 to wrap up and leave.

**On the server:** Sends a stop signal to the process with that ID. It asks nicely first. There are rougher options, which you should not need as a beginner.

**Use it when:** Rarely. If PM2 manages a program, use PM2 to stop it instead, or PM2 may just start it again.

```sh
curl -I https://example.com
```

**Name stands for:** curl = Client URL

**In the bakery:** Phone another shop and ask only "are you open?" without ordering anything.

**On the server:** Makes a web request from the server. -I asks for just the headers, such as the status code (200 means OK).

**Use it when:** To check whether the server can reach a website or whether a site is up.

## Helpers you will use every day

Small things that make everything else easier.

```sh
sudo command
```

**Name stands for:** sudo = SUperuser DO

**In the bakery:** Borrow the owner's master key for one action.

**On the server:** Runs one command with administrator rights, if your account is allowed.

**Use it when:** Only when you know why you need it. "Permission denied" is often a hint to check the path, not to reach for sudo.

```sh
Tab · Up arrow · history
```

**Name stands for:** history = the list of past commands

**In the bakery:** Tab: the helper finishes the word for you. Up arrow: "say that last thing again." history: the notebook of everything you said today.

**On the server:** Tab auto completes file and folder names. The Up arrow brings back previous commands. history lists them.

**Use it when:** Always. It saves typing and typos.

```sh
clear
man ls
```

**Name stands for:** clear = clear the screen; man = MANual

**In the bakery:** Wipe the whiteboard. Or open the manual that came with the oven.

**On the server:** clear tidies the screen. man shows the manual of any command (press q to leave it).

**Use it when:** When the screen is a mess, or when you want to know what a command can do.

```sh
echo "shift checked" >> notes.txt
```

**Name stands for:** echo = repeat back; >> = add to the end of a file

**In the bakery:** Say something out loud, and also write it at the bottom of the card.

**On the server:** echo prints text. >> appends it to a file. A single > would replace the whole file, so be careful which one you type.

**Use it when:** For quick notes and in scripts. Mixing up > and >> is a classic way to wipe a file.

## Three stories from a real server

These three happened on a small server I look after. The details are changed, but the lessons are exactly as they happened, and each one comes back in the troubleshooting list below.

### The sign that would not come down

One of my programs has a deploy script: the set of steps that puts a new version live. Its first step is to hang a "baker working" sign on the oven, a tiny file called a lock file. Its last step is to take the sign down. One evening the script stopped halfway and the sign stayed up. Every run after that refused to start, insisting another deploy was already in progress, because the script is polite and will not touch an oven that says someone is working. There was no someone. The fix was to check that nothing was actually running (pm2 list, ps) and take the sign down by hand, which just means deleting the lock file. What it taught me: a lock file is a note, not a lock. It works only because every script agrees to respect it, and it cannot tell a working baker from a sign nobody took down.

### The key that expires every night

The same server runs a program that has to log into an outside service before it can do its job. The service hands out a key that lasts one day, like a warehouse that changes its lock at closing time. Every night the key expires, and the next morning the program fails with "unauthorized" until someone picks up today's key by logging in again. The failure looks scary in the diary the first time you see it, but it is really just part of the opening routine: first job of the day, fetch today's key. What it taught me: an "unauthorized" error that arrives at a regular time is usually an expired login, not a bug in the code.

### The baker who looks awake but is not

PM2, the shift manager, restarts a baker who falls over. But one night the whiteboard said "online" and no bread was coming out: the baker was standing at the oven, awake, staring at the wall. PM2 checks that the baker is present, not that they are working. So I added a small watchdog: a separate check that phones the program every few minutes and asks "are you actually answering?", which is exactly the curl command above. If there is no answer, the watchdog asks the shift manager for a fresh baker (pm2 restart). What it taught me: "running" and "working" are two different facts, and it takes a separate check for each.

## The most common problems, and what to do first

This is the section to bookmark. Every item below is one you will meet sooner or later. Each shows what the error looks like, what it means in the bakery, what is usually wrong, and the first thing to do.

```
pm2: command not found
```

**In the bakery:** You asked the kitchen helper for a tool this kitchen does not have, or you mispronounced its name.

**What it usually means:** The name is typed wrong (upper and lower case matter), or the tool is not installed on this server, or it is installed somewhere the shell does not look. Installing something on your laptop does not install it in the bakery.

**What to do first:** Check the spelling letter by letter. If it is right, the tool is probably not installed here: install it on the server the same way you installed it at home. "which pm2" tells you whether the shell can find it at all.

```
bash: ./deploy.sh: Permission denied
```

**In the bakery:** A room or a tool with a lock that your badge does not open.

**What it usually means:** One of three things. The file is not marked as runnable (fix with chmod u+x). It belongs to another account and you are not allowed to touch it. Or the action genuinely needs the owner's master key (sudo).

**What to do first:** Run ls -l and read who owns the file and who may do what. For your own script, chmod u+x deploy.sh. Think before reaching for sudo: "denied" is often a hint that you are standing in the wrong room, not that you need a bigger key.

```
cd bakery-ap: No such file or directory
```

**In the bakery:** You are reading the label of the wrong shelf, or a label that does not exist.

**What it usually means:** Wrong room, wrong name, or wrong case. Notes.txt and notes.txt are different cards. This is the most common error of all, and the least dramatic.

**What to do first:** pwd to see which room you are in, then ls to see what is actually on the shelf. Compare the names letter by letter, including capitals.

```
Error: listen EADDRINUSE: address already in use :::3000
```

**In the bakery:** Two bakers told to use the same oven at the same time.

**What it usually means:** A program is already listening on that counter number (the port). Very often it is an earlier copy of your own program that never stopped, or a crashed one that PM2 quietly restarted.

**What to do first:** Find who holds the counter: pm2 list first, or sudo lsof -i :3000 for anything. Stop the old program (pm2 stop, or kill with its process ID), or give the new one a different port.

```
pm2 list shows restarts: 47 (and climbing)
```

**In the bakery:** The baker faints, the shift manager props them back up, they faint again.

**What it usually means:** The program crashes on startup or soon after, and PM2 faithfully restarts it forever. The restart count climbing is the giveaway that this is a loop, not a one-off.

**What to do first:** pm2 logs bakery-app --lines 50 and read the last real error. Fix the cause, then restart. Restarting without reading the diary just counts higher.

```
No space left on device
```

**In the bakery:** The pantry is stacked to the ceiling and the new flour delivery cannot come in.

**What it usually means:** The server's storage is full. Once it is full, unrelated things start failing in confusing ways: installs break, logs stop, sometimes even logging in acts up.

**What to do first:** df -h shows how full each disk is. The usual suspects are old log files and forgotten downloads. Delete carefully: rm has no bin to dig through later.

```
Error: another deploy is already running
```

**In the bakery:** The "baker working" sign is still hanging on the oven from a shift that ended badly.

**What it usually means:** A script hung its sign (a lock file) when it started and crashed before taking it down. Every later run politely respects the sign and refuses, even though nobody is working.

**What to do first:** Confirm nobody really is working: pm2 list and ps. Then take the sign down yourself by removing the lock file. The full story is in the previous section.

```
401 Unauthorized
```

**In the bakery:** Yesterday's warehouse key in today's lock.

**What it usually means:** The login key the program uses to talk to an outside service has expired. If it fails at the same time every day, an expiring key is almost always the reason.

**What to do first:** Log in again and pick up today's key. If this happens daily, make fetching the key part of the opening routine instead of a surprise.

```
ssh: connect to host server.example port 22: Connection refused
```

**In the bakery:** You phone the bakery and either nobody picks up, or the line itself is dead.

**What it usually means:** "Timed out" usually means the call never reached the building: wrong address, your network, or the server is off. "Connection refused" means the call arrived and was turned away: the phone service (SSH) is not running, or a locked door (a firewall) sits in between.

**What to do first:** Check the address and your own connection first. Then whether the server is switched on at all, and whether the SSH service is running on it.

```
(no error: the site just shows yesterday's behaviour)
```

**In the bakery:** You mailed the new recipe to the bakery, but the baker on shift is still baking the old one from memory.

**What it usually means:** You pulled new code onto the server, or forgot to pull, and the running program never re-read it. A running baker keeps the recipe in their head until they are sent home and called back.

**What to do first:** On the server: git status and git pull --ff-only to make sure the latest recipe is there, then pm2 restart bakery-app so the program actually uses it.

## When something breaks, check in this order

Whatever the symptom is, this order finds most problems quickly:

1. Is the baker on shift? pm2 list.
2. What does the diary say? pm2 logs bakery-app --lines 50.
3. Is the pantry full? df -h.
4. Can the bakery reach the outside world? curl -I https://example.com.
5. Is the recipe current, and did the baker re-read it? git pull --ff-only, then pm2 restart bakery-app.

Most problems announce themselves in the first two steps. The diary almost always knows.

> **A restart is not a fix**
>
> pm2 restart makes the program re-read its code, but it also drops whatever the baker was holding mid-batch. Read the diary first, and restart when the shop is quiet.

## Where this leaves you

You can now get into a server, put a program on it, keep it running after you leave, read what it is telling you, and work through the everyday ways it breaks. That is genuinely most of the job. Everything else is these same commands with longer names.

## Keep learning

Technical references: [Linux command guide](https://developers.redhat.com/cheat-sheets/linux-commands-cheat-sheet), [PM2 quick start](https://pm2.keymetrics.io/docs/usage/quick-start/), [Bash shell](https://man7.org/linux/man-pages/man1/bash.1.html), and [OpenSSH manuals](https://www.openssh.org/manual.html).
