
# Plan: Vaste nummering voor dagelijkse taken

## Probleem
De nummering is nu `index + 1` (positie in de lijst). Als taak 1 wordt afgevinkt, schuift de nummering op: taak 2 wordt "1", taak 3 wordt "2", etc.

## Oplossing
Gebruik de `sort_order` van de taak als vast nummer in plaats van de array-index. Elke taak behoudt dan altijd hetzelfde nummer, ongeacht of andere taken zijn afgevinkt.

## Wijziging

**Bestand: `src/components/foh/FohTasks.tsx` (regel 2225)**

Van:
```
taskNumber={index + 1}
```

Naar:
```
taskNumber={task.sort_order != null ? task.sort_order + 1 : index + 1}
```

Dit zorgt ervoor dat:
- Taak met `sort_order: 0` altijd nummer 1 is
- Taak met `sort_order: 1` altijd nummer 2 is
- Etc., ook als taak 1 is afgevinkt

Als `sort_order` niet beschikbaar is (fallback), wordt `index + 1` gebruikt.
