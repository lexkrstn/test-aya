# Test task from Aya

## Table of contents

- [Task](#task)
  - [File format](#file-format)
  - [Requests](#requests)
  - [Questions](#questions)
- [Implementation](#implementation)
  - [Database update](#database-update)
  - [API](#api)
  - [Answers](#answers)
  - [Answers (RU)](#answers-ru)

## Task

### File format

A plain text format representing objects with properties and other nested
objects. The hierarchy is defined by indentation (each level 2 spaces).
The type of each object is called with a capital letter, properties with a small
one. The file contains a list of employees (Employee), each has basic properties
(first name, last name, ID). Also, each employee belongs to some department
(Department) and has a list of salaries (Statement) for the year. The salary is
determined by the date and amount (always in USD). An employee may also have
records of charitable contributions (Donation), the contribution amount can be
in any currency. In addition, the file contains the exchange rates (Rate) for
all date-currency pairs that were encountered in contributions.
It is enough to store the equivalent of contributions in USD in the database.

### Requests

1. Find the employees who donated more than 10% of their average monthly salary
   to charity in the last 6 months and sort them by minimum average annual salary.
2. Display the departments in descending order of the difference between the
   maximum and minimum average annual salary; for each department up to 3
   employees with the largest increase in salary for the year (in percent)
   and the amount of the last salary.
3. For the employees who donated more than $100 to charity, calculate a one-time
   reward equivalent to their contribution, from a pool of $10,000;
   if an employee sent $200 out of a total of $1,000 donations, he/she should
   receive 20% of the $10,000;
   employee contributions less than $100 count towards the total, but the
   employees themselves do not receive remuneration;
4. Add $100 to each employee from the department with the highest amount of
   donations per person.

### Questions

1. How to change the code to support different file versions?
2. How the import system will change if data on exchange rates disappear from
   the file, and it will be necessary to receive them asynchronously (via API)?
3. In the future, the client may want to import files through the web interface,
   how to change the system to do this?
4. How would requests change if imported data might not be taken into account
   immediately, but only for the last month/year?

## Implementation

### Database update

1. `src/infrastructure/object-file` (*implementation took ~3h*)
    1. *ObjectFileParser* - asynchronously converts the file format into the
       stream of abstract tree nodes (*CompositeObject*).
    2. *RecordParser* - asynchronously converts abstract tree node stream to
       business entities (as DTO's).

2. `src/infrastructure/db-updater` (*implementation took ~1h*)

    *DbUpdater* - listens to parsed business entities and uses them to update
    the database. It's more effective if `Rate` records come before
    `Donation`'s in the file since the updater doesn't have just to collect
    the donations until appropriate `Rate` records emerge.

3. `src/application/services/db-update.service.ts`(*implementation took ~15m*)

   *DbUpdateService* - intergrates *DbUpdater* into NestJS app lifecycle to
   trigger updating upon application startup.

### API

1. `GET /api/v1/donators` (*implementation took ~1h*)

   | Parameter | Description |
   | --------- | :---------- |
   | `ratio`   | Ratio between donation and salary. Default: `0.1`. |
   | `date`    | Date to be considered current (`YYYY-MM-DD`). Optional. |
   | `months`  | Number of months before the `date` to take into account. Default: `6`. |

   Controller: `src/application/api/donators.controller.ts`.

   Use case: `src/domain/use-cases/get-donators.ts`.

   Gateway: `src/infrastructure/gateways/employees.gateway.ts`.

2. `GET /api/v1/departments` (*implementation took ~1h 30m*)

   | Parameter   | Description |
   | ----------- | :---------- |
   | `employees` | Number of top employees per department to show. Default: `3`. |
   | `date`      | Date to be considered current (`YYYY-MM-DD`). Optional. |
   | `months`    | Number of months before the `date` to take into account. Default: `12`. |

   Controller: `src/application/api/departments.controller.ts`.

   Use case: `src/domain/use-cases/get-departments.ts`.

   Gateways: `src/infrastructure/gateways/departments.gateway.ts`,
             `src/infrastructure/gateways/employees.gateway.ts`.

3. `GET /api/v1/donator-compensations` (*implementation took ~1h*)

   | Parameter | Description |
   | --------- | :---------- |
   | `pool`    | Pool size. Default: `10000`. |
   | `minSum`  | Minimum donation amount to get compensation. Default: `100`. |
   | `from`    | Start date (`YYYY-MM-DD`). Default: `1970-01-01`. |
   | `to`      | End date (`YYYY-MM-DD`). Default: current date. |

   Controller: `src/application/api/accounting.controller.ts`.

   Use case: `src/domain/use-cases/get-donator-compensations.ts`.

   Gateway: `src/infrastructure/gateways/accounting.gateway.ts`.

4. `POST /api/v1/department-rewards` (*implementation took ~45m*)

   | Parameter | Description |
   | --------- | :---------- |
   | `amount`  | Reward size in USD. Default: `100`. |
   | `from`    | Start date (`YYYY-MM-DD`). Default: `1970-01-01`. |
   | `to`      | End date (`YYYY-MM-DD`). Default: current date. |

   Controller: `src/application/api/accounting.controller.ts`.

   Use case: `src/domain/use-cases/reward-most-donated-department.ts`.

   Gateway: `src/infrastructure/gateways/accounting.gateway.ts`.

### Answers

1. > How to change the code to support different file versions?

   The `ObjectFileParser` class is responsible for parsing the file format.
   So, if one needs to add a new file format, he/she will either have to create
   a new file parser or inherit it from `ObjectFileParser` (in case if the
   structure of the file formats do not differ too much and the code can be
   reused). Also it's a good idea to extract public methods of `ObjectFileParser`
   to a separate interface so as to support polymorphism.

   If the structure of the entities stored in the file changes, then one will
   have to change the `RecordParser` class, which is responsible for parsing the
   entities, in the same way. Besides that, changes will be required in the
   `DbUpdater` class, which depends on the domain entities as well.

2. > How will the import system change if the data on exchange rates disappear
   > from the file, and it will be necessary to receive them asynchronously
   > (via API)?

   One will need:
   1. Unbind the `DbUpdater::consumeRate` callback function from the parser in
      the `DbUpdter'a` code (passing `null` instead).
   2. Write a functional for extracting exchange rates from another source.
   3. Bind the `DbUpdater::consumeRate` function to the new data source.

   You can start parsing from a file and currency data mining asynchronously
   (i.e. in parallel). The current implementation accumulates parsed data that
   depends on exchange rate information in memory until it (rate information)
   appears in the stream. And only then uses it to update DB.

3. In the future, the client may want to import files through the web interface.
   How to change the system to do this?

   Write a controller for the upload endpoint and use the
   `DbUpdateService::updateFromFile()` method in it.

4. How would requests change if imported data might not be taken into account
   immediately, but only for the last month/year?

   First, for all `GET` requests, it would be possible to add caching on the
   controller and store JSON responses in Redis hashtables with TTL cache
   invalidation.

   Also, if additional optimization is needed the resource-intensive part of the
   subqueries could be saved in Materialized Views. For instance, the query in
   the `EmployeesGateway::getDonators()` function at the top level JOIN's
   two subqueries. The first one gets the employee profile with the amount of
   donations and the average salary for a certain period, and the second query
   calculates the average annual salary. If the data were not taken into account
   immediately, then the second subquery could be placed entirely in the
   Materialized View.

   To optimize the first subquery, one could add JSON columns in the employees
   table to store denormalized salary and donation data as arrays. This would
   turn a subquery with a resource-intensive JOIN on three tables and Window
   functions followed by a DISTINCT select into a simple filtered SELECT
   statement, burdened only by calculating the average salary and the amount
   of donations from JSON fields.

### Answers (RU)

1. > Как поменять код чтобы поддерживать разные версии файлов?

   За разбор формата файла отвечает класс `ObjectFileParser`. Соответственно,
   если необходимо добавить новый формат файла, нужно будет либо создать новый
   парсер. Либо унаследовать его от `ObjectFileParser` в случае если структурно
   форматы файлов не отличаются незначительно и код можно будет переиспользовать
   повторно. Публичные методы `ObjectFileParser` нужно будет вынести в отдельный
   интерфейс для поддержки полиморфизма.

   Если изменится структура сущностей, хранимых в файле, то за их разбор
   отвечает класс `RecordParser`, который придется изменить аналогичным образом.
   Также в этом случае потребуются изменения в классе `DbUpdater` для
   соответсвующего изменения использования этих сущностей для обновления БД.

2. > Как изменится система импорта если из файла пропадут данные о курсах обмена,
   > и нужно будет получать их асинхронно (по API)?

   Будет нужно:
   1. Отвязать колбек функцию `DbUpdater::consumeRate` от парсера в коде
   `DbUpdter'a` (поставить вместо нее `null`).
   2. Написать функционал для добычи курсов валют из другого источника.
   3. Привязать функцию `DbUpdater::consumeRate` к новому добытчику.

   Запускать парсинг из файла и добычу данных можно асинхронно (параллельно).
   Текущая реализация накапливает в памяти разобранные данные, зависящие от
   информации о курсах обмена, пока те (курсы обмена) не появляются в потоке.
   И только после этого использует их для обновления БД.

3. > В будущем клиент может захотеть импортировать файлы через веб-интерфейс,
   > как изменить систему для этого?

   Написать контроллер для эндпоинта загрузки этих файлов и использовать в нем
   метод `DbUpdateService::updateFromFile()`.

4. > Как бы изменились запросы если импортированные данные могут не учитываться
   > сразу, а только за прошлый месяц/год?

   Во-первых, для всех `GET` запросов можно было бы добавить кэширование на
   контроллере с хранением JSON ответов, например, в хаштаблицах Redis с
   инвалидацией кэша по TTL.

   Также ресурсоемкую часть подзапросов можно было бы при необходимости
   дополнительной оптимизации сохранить в Materialized Views. Например, запрос
   в функции `EmployeesGateway::getDonators()` на самом верхнем уровне
   использует объединение двух подзапросов: один получает профиль работиника с
   суммой донатов и средней зарплатой за определенный промежуток, времени (дат),
   а во втором запросе вычисляется среднегодовая зарплата. Если бы данные
   учитывались не сразу, то можно было бы второй подзапрос целиком поместить в
   Materialized View.

   Для оптимизации первого же подзапроса можно было бы добавить JSON колонки в
   таблице работников для хранения денормализованных данных о зарплате и
   пожертвованиях в виде массивов. Это бы превратило подзапрос с ресурсоемким
   JOIN'ом по трем таблицам с использованием Window функций и последующей
   DISTINCT выборкой в простую выборку с фильтрацией, отягощенную только
   вычислением средней зарплаты и суммы пожертвований из JSON полей.
