const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const Event = require("../models/event");
const EventHistory = require("../models/eventHistory");
const EventType = require("../models/eventType");
const EventCategory = require("../models/eventCategory");
const EventCoverage = require("../models/eventCoverage");
const EventDate = require("../models/eventDate");
const Lecturer = require("../models/lecturer");
const EventLecturer = require("../models/eventLecturer");
const Organizer = require("../models/organizer");
const EventOrganizer = require("../models/eventOrganizer");
const EventExpense = require("../models/eventExpense");
const EventExpenseType = require("../models/eventExpenseType");
const User = require("../models/user");
const ActiveSession = require("../models/activeSession");

const reqAuth = require("../config/safeRoutes").reqAuth;
const faker = require("faker");

// route /admin/events/
router.post("/all", reqAuth, async function (req, res) {
  try {
    const token = String(req.headers.authorization);
    const session = await ActiveSession.find({ token });
    const user_id = session[0].userId;
    const userLogged = await User.findById(user_id)
      .populate("user_type_id", "permission")
      .select("name");
    let filter = {};
    if (!userLogged) {
      return res.status(500).json({
        success: false,
        msg: "Erro ao buscar o usuário logado",
      });
    }
    if (!userLogged.user_type_id || !userLogged.user_type_id.permission) {
      return res.status(500).json({
        success: false,
        msg: "Tipo ou permissão do usuário não encontrado",
      });
    }

    let adminChanging = false;
    if (userLogged.user_type_id.permission === "1") {
      // Se usuário for "Proponente", deve mostrar apenas eventos relacionados à eles
      filter = { user_id };
    } else if (
      ["2", "3", "5"].indexOf(userLogged.user_type_id.permission) !== -1
    ) {
      // Senão, mostrar todos os eventos (do usuário & entre os status: "Revisão", "Recusado", "Aprovado", "Finalizado")
      adminChanging = true;
      filter = {
        $or: [
          { user_id },
          { status: { $in: ["revision", "refused", "approved", "finished"] } },
          // TODO: Verificar se serão esses status
        ],
      };
    }

    return Event.find(filter)
      .populate([
        {
          path: "dates",
          select: "start_date end_date",
          options: {
            sort: {
              start_date: 1,
              end_date: 1,
            },
          },
        },
        {
          path: "event_type_id",
          select: "name",
        },
        {
          path: "user_id",
          select: "name",
        },
      ])
      .exec((err, events) => {
        if (err) {
          return res.status(500).json({ success: false, msg: err });
        }
        events = events.map(function (item) {
          const ev = item.toJSON();
          ev.__v = undefined;
          ev.date = "";
          ev.disabled =
            ["created", "correct", "finished"].indexOf(ev.status) === -1 &&
            !adminChanging;
          if (item.dates && item.dates.length) {
            if (item.dates.length === 1) {
              // Event has just one date
              const startDate = toDateFormatted(item.dates[0].start_date);
              const endDate = toDateFormatted(item.dates[0].end_date);
              if (
                endDateIsBiggerAndAnotherDayFromStartDate(startDate, endDate)
              ) {
                // If end_date is bigger then and another day of start_date
                ev.date = `${startDate} até ${endDate}`;
              } else {
                ev.date = startDate;
              }
              ev.calendar_dates = [
                toDateFormatted(item.dates[0].start_date, true),
              ];
            } else {
              // Event has more than one date
              const startDate = toDateFormatted(
                findMinStartDateOnObject(item.dates).start_date
              );
              const endDate = toDateFormatted(
                findMaxEndDateOnObject(item.dates).end_date
              );
              if (
                endDateIsBiggerAndAnotherDayFromStartDate(startDate, endDate)
              ) {
                // If end_date is bigger then and another day of start_date
                ev.date = `${startDate} até ${endDate}`;
              } else {
                ev.date = startDate;
              }
              ev.calendar_dates = item.dates.map((itemDate) =>
                toDateFormatted(itemDate.start_date, true)
              );
            }
          }
          ev.dates = undefined;
          return ev;
        });
        return res.json(events);
      });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
});

router.post("/create", reqAuth, async (req, res) => {
  const {
    name,
    event_type_id,
    category: {
      id: category_id,
      second_field_value: category_second_field_value,
    },
    coverage: {
      id: coverage_id,
      second_field_value: coverage_second_field_value,
    },
    dates,
    workload,
    place,
    audience_estimate,
    online,
    link,
    ticket,
    objective,
    reason,
    schedule,
    details,
    resources,
    lecturers,
    organizers,
    expenses,
    receipt_amount,
    total_amount,
    send_to_review,
  } = req.body;

  let eventID = null;

  try {
    const token = String(req.headers.authorization);
    const session = await ActiveSession.find({ token });
    const user_id = session[0].userId;
    const userLogged = await User.findById(user_id)
      .populate("user_type_id", "permission")
      .select("name");
    if (!userLogged) {
      return res.status(500).json({
        success: false,
        msg: "Erro ao buscar o usuário logado",
      });
    }
    if (!userLogged.user_type_id || !userLogged.user_type_id.permission) {
      return res.status(500).json({
        success: false,
        msg: "Tipo ou permissão do usuário não encontrado",
      });
    }

    const query = {
      user_id,
      name,
      event_type_id,
      category_id,
      category_second_field_value,
      coverage_id,
      coverage_second_field_value,
      // workload,
      // place,
      // audience_estimate,
      // online,
      // link,
      // ticket,
      objective,
      reason,
      // schedule,
      // details,
      // resources,
      receipt_amount,
      total_amount,
      status: send_to_review ? "revision" : "created", // Se é alteração do status, é alterado para "Em revisão"
    };

    const validation = await validateEventNameUserTypeCategoryAndCoverage({
      event_name: name,
      event_id: null,
      user_id,
      event_type_id,
      category_id,
      coverage_id,
    });

    if (!validation.success) {
      return res.status(500).json({
        success: false,
        msg:
          validation.msg ||
          "Erro ao criar o evento. Entre em contato com o administrador do sistema.",
      });
    }

    Event.create(query, async function (err, event) {
      if (err) {
        const firstErrorKey = Object.keys(err.errors).shift();
        if (firstErrorKey) {
          return res.status(500).json({
            success: false,
            msg: err.errors[firstErrorKey].message,
          });
        }
        return res.status(500).json({
          success: false,
          msg: err,
        });
      }

      eventID = event._id;
      event.event_id = eventID;

      // addEventHistory(event);

      // Relate each date to event
      relateDatesWithEvent(dates, eventID);

      // Relate each lecturer to event
      relateLecturersWithEvent(lecturers, eventID);

      // Relate each organizer to event
      relateOrganizersWithEvent(organizers, eventID);

      // Relate each expense to event
      relateExpensesWithEvent(expenses, eventID, true);

      return res.json({
        success: true,
        eventID: eventID,
        msg: "Evento criado com sucesso",
      });
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
});

router.post("/get/:eventID", reqAuth, async function (req, res) {
  const { eventID } = req.params;

  try {
    const token = String(req.headers.authorization);
    const session = await ActiveSession.find({ token });
    const user_id = session[0].userId;
    const userLogged = await User.findById(user_id)
      .populate("user_type_id", "permission")
      .select("name");
    if (!userLogged) {
      return res.status(500).json({
        success: false,
        msg: "Erro ao buscar o usuário logado",
      });
    }
    if (!userLogged.user_type_id || !userLogged.user_type_id.permission) {
      return res.status(500).json({
        success: false,
        msg: "Tipo ou permissão do usuário não encontrado",
      });
    }

    return Event.findOne({ _id: eventID })
      .populate([
        { path: "user_id", select: "name" },
        {
          path: "dates",
          select:
            "start_date end_date workload place audience_estimate online link ticket schedule details resources",
        },
        {
          path: "lecturers",
          select: "lecturer_id type",
          populate: { path: "lecturer_id", select: "name office lattes email" },
        },
        {
          path: "organizers",
          select: "organizer_id office workload",
          populate: {
            path: "organizer_id",
            select: "name identification email",
          },
        },
        {
          path: "expenses",
          select: "expense_id provider amount file filename comments",
          populate: { path: "event_expense_type_id", select: "name" },
        },
      ])
      .then(async (event) => {
        if (!event) {
          return res
            .status(500)
            .json({ success: false, msg: "Evento não encontrado" });
        }
        // Usuário logado é "Proponente" e o evento não está disponível para ele consultar
        if (
          userLogged.user_type_id.permission === "1" &&
          ["created", "correct", "finished"].indexOf(event.status) === -1
        ) {
          return res.status(500).json({
            success: false,
            msg: "Você não tem permissão para acessar esse evento",
          });
        }

        event.__v = undefined;

        if (
          !event.user_id ||
          !event.user_id._id ||
          event.user_id._id.toString() !== user_id
        ) {
          return res.status(500).json({
            success: false,
            msg: "Você não tem permissão para acessar esse evento",
          });
        }
        let dates = event.dates;
        if (dates && dates.length) {
          dates = dates.map(function (date) {
            const dt = date.toJSON();
            dt.date = toDateFormatted(date.start_date, true);
            dt.start_time = transformDateToTime(date.start_date);
            dt.end_time = transformDateToTime(date.end_date);
            dt.workload = date.workload;
            dt.place = date.place;
            dt.audience_estimate = date.audience_estimate;
            dt.online = date.online;
            dt.link = date.link;
            dt.ticket = date.ticket;
            dt.schedule = date.schedule;
            dt.details = date.details;
            dt.resources = date.resources;
            dt.event_id = undefined;
            dt.start_date = undefined;
            dt.end_date = undefined;
            return dt;
          });
        }
        let lecturers = event.lecturers;
        if (lecturers && lecturers.length) {
          lecturers = lecturers.map(function (lecturer) {
            const lect = lecturer.toJSON();
            if (!lecturer.lecturer_id) {
              lecturer.lecturer_id = {
                name: null,
                office: null,
                email: null,
                lattes: null,
              };
            }
            lect.name = lecturer.lecturer_id.name;
            lect.office = lecturer.lecturer_id.office;
            lect.lattes = lecturer.lecturer_id.lattes;
            lect.email = lecturer.lecturer_id.email;
            lect.guest = lecturer.type === "guest";
            lect.type = undefined;
            lect.event_id = undefined;
            return lect;
          });
        }
        let organizers = event.organizers;
        if (organizers && organizers.length) {
          organizers = organizers.map(function (organizer) {
            const org = organizer.toJSON();
            if (!organizer.organizer_id) {
              organizer.organizer_id = {
                name: null,
                identification: null,
                email: null,
              };
            }
            org.name = organizer.organizer_id.name;
            org.identification = organizer.organizer_id.identification;
            org.email = organizer.organizer_id.email;
            org.event_id = undefined;
            return org;
          });
        }
        let expenses = event.expenses;
        if (expenses && expenses.length) {
          expenses = expenses.map(function (expense) {
            const exp = expense.toJSON();
            exp.amount = exp.amount.toFixed(2);
            exp.event_id = undefined;
            exp.file_uploaded = !!exp.file;
            return exp;
          });
        }

        let histories = null;

        await EventHistory.find({ event_id: eventID })
          .populate([
            { path: "user_id", select: "name" },
            { path: "event_type_id", select: "name" },
            { path: "category_id", select: "name" },
            { path: "coverage_id", select: "name" },
            { path: "dates", select: "start_date end_date" },
            {
              path: "lecturers",
              select: "lecturer_id type",
              populate: {
                path: "lecturer_id",
                select: "name office lattes email",
              },
            },
            {
              path: "organizers",
              select: "organizer_id office workload",
              populate: {
                path: "organizer_id",
                select: "name identification email",
              },
            },
            {
              path: "expenses",
              select: "expense_id provider amount file comments",
              populate: { path: "event_expense_type_id", select: "name" },
            },
          ])
          .then(async (eventsHistories) => {
            if (eventsHistories) {
              eventsHistories = eventsHistories.map((eventHistory) => {
                const history = eventHistory.toJSON();
                history.online = history.online ? "Sim" : "Não";
                history.receipt_amount = history.receipt_amount
                  ? formatAmount(history.receipt_amount)
                  : null;
                history.total_amount = history.total_amount
                  ? formatAmount(history.total_amount)
                  : null;
                history.__v = undefined;
                history.updatedAt = toDateFormatted(
                  eventHistory.updatedAt,
                  false,
                  true
                );
                if (history.dates && history.dates.length) {
                  history.dates = history.dates.map((historyDate) => {
                    historyDate.infos = `${toDateFormatted(
                      historyDate.start_date
                    )}, das ${transformDateToTime(
                      historyDate.start_date
                    )} às ${transformDateToTime(historyDate.end_date)}`;
                    historyDate.start_date = undefined;
                    historyDate.end_date = undefined;
                    return historyDate;
                  });
                }
                if (history.lecturers && history.lecturers.length) {
                  history.lecturers = history.lecturers.map(
                    (historyLecturer) => {
                      if (!historyLecturer.lecturer_id) {
                        historyLecturer.lecturer_id = {
                          name: null,
                          office: null,
                          email: null,
                          lattes: null,
                        };
                      }
                      historyLecturer.infos = `${
                        historyLecturer.lecturer_id.name
                      } | ${historyLecturer.lecturer_id.office} | ${
                        historyLecturer.lecturer_id.email
                      } | ${historyLecturer.lecturer_id.lattes} | ${
                        historyLecturer.type === "guest" ? "Sim" : "Não"
                      }`;
                      historyLecturer.type = undefined;
                      historyLecturer.lecturer_id = undefined;
                      return historyLecturer;
                    }
                  );
                }
                if (history.organizers && history.organizers.length) {
                  history.organizers = history.organizers.map(
                    (historyOrganizer) => {
                      if (!historyOrganizer.organizer_id) {
                        historyOrganizer.organizer_id = {
                          name: null,
                          identification: null,
                          email: null,
                        };
                      }
                      historyOrganizer.infos = `${
                        historyOrganizer.organizer_id.name
                      } | ${historyOrganizer.organizer_id.identification} | ${
                        historyOrganizer.office
                      } | ${
                        historyOrganizer.organizer_id.email
                      } | ${historyOrganizer.workload.toString()}h`;
                      historyOrganizer.office = undefined;
                      historyOrganizer.workload = undefined;
                      historyOrganizer.organizer_id = undefined;
                      return historyOrganizer;
                    }
                  );
                }
                if (history.expenses && history.expenses.length) {
                  history.expenses = history.expenses.map((historyExpense) => {
                    historyExpense.infos = `${
                      historyExpense.event_expense_type_id.name
                    } | ${historyExpense.provider} | ${formatAmount(
                      historyExpense.amount
                    )}`;
                    historyExpense.provider = undefined;
                    historyExpense.amount = undefined;
                    historyExpense.event_expense_type_id = undefined;
                    return historyExpense;
                  });
                }
                return history;
              });
              histories = eventsHistories;
            }
          });

        return res.json({
          ...event.toObject(),
          dates,
          lecturers,
          organizers,
          expenses,
          histories,
        });
      });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
});

router.post("/edit/:eventID", reqAuth, function (req, res) {
  const { eventID } = req.params;

  const {
    name,
    event_type_id,
    category: {
      id: category_id,
      second_field_value: category_second_field_value,
    },
    coverage: {
      id: coverage_id,
      second_field_value: coverage_second_field_value,
    },
    dates,
    // workload,
    // place,
    // audience_estimate,
    // online,
    // link,
    // ticket,
    objective,
    reason,
    // schedule,
    // details,
    // resources,
    lecturers,
    organizers,
    expenses,
    receipt_amount,
    total_amount,
    send_to_review,
  } = req.body;

  try {
    Event.findById(eventID).then(async (event) => {
      if (!event) {
        return res
          .status(500)
          .json({ success: false, msg: "Evento não encontrado" });
      }
      const token = String(req.headers.authorization);
      const session = await ActiveSession.find({ token: token });
      const user_id = session[0].userId;
      const userLogged = await User.findById(user_id)
        .populate("user_type_id", "permission")
        .select("name");
      if (!userLogged) {
        return res.status(500).json({
          success: false,
          msg: "Erro ao buscar o usuário logado",
        });
      }
      if (!userLogged.user_type_id || !userLogged.user_type_id.permission) {
        return res.status(500).json({
          success: false,
          msg: "Tipo ou permissão do usuário não encontrado",
        });
      }
      // Usuário logado é "Proponente" e o evento não está disponível para ele alterar
      if (
        userLogged.user_type_id.permission === "1" &&
        ["created", "correct", "finished"].indexOf(event.status) === -1
      ) {
        return res.status(500).json({
          success: false,
          msg: "Você não tem permissão para alterar esse evento",
        });
      }

      const validation = await validateEventNameUserTypeCategoryAndCoverage({
        event_name: name,
        event_id: eventID,
        user_id,
        event_type_id,
        category_id,
        coverage_id,
      });

      if (!validation.success) {
        return res.status(500).json({
          success: false,
          msg:
            validation.msg ||
            "Erro ao criar o evento. Entre em contato com o administrador do sistema.",
        });
      }

      let adminChanging = false;
      if (
        event.user_id !== user_id &&
        ["2", "3", "5"].indexOf(userLogged.user_type_id.permission) !== -1
      ) {
        // Verifica se o usuário que está alterando é o mesmo que criou o evento & o usuário que está alterando tem permissão de admin ("2", "3", "5")
        adminChanging = true;
      }
      const oldStatus = event.status;
      const newStatus = send_to_review // Se é alteração do status
        ? ["created", "correct"].indexOf(oldStatus) !== -1 // Se o status antigo é "Criado"/"Corrigir", é alterado para "Em revisão"
          ? "revision"
          : oldStatus === "revision" && adminChanging // Se o status antigo é "Em revisão" e o usuário que está alterando é um admin ("2", "3", "5"), é alterado para "Corrigir"
          ? "correct"
          : oldStatus
        : oldStatus;

      // TODO: Detectar alteração de status "Reprovado", "Aprovado" e "Finalizado"

      const query = { _id: eventID };
      const newvalues = {
        $set: {
          name,
          event_type_id,
          category_id,
          category_second_field_value,
          coverage_id,
          coverage_second_field_value,
          // workload,
          // place,
          // audience_estimate,
          // online,
          // link,
          // ticket,
          objective,
          reason,
          // schedule,
          // details,
          // resources,
          receipt_amount,
          total_amount,
          status: newStatus,
        },
      };
      Event.updateOne(query, newvalues, function (err, cb) {
        if (err) {
          return res.status(500).json({
            success: false,
            msg: "Ocorreu um erro. Favor contatar o administrador",
          });
        }

        // addEventHistory({
        //   ...event,
        //   event_id: eventID,
        //   user_id,
        //   dates,
        //   lecturers,
        //   organizers,
        //   expenses,
        // });

        // Relate each date to event
        relateDatesWithEvent(dates, eventID);

        // Relate each lecturer to event
        relateLecturersWithEvent(lecturers, eventID);

        // Relate each organizer to event
        relateOrganizersWithEvent(organizers, eventID);

        // Relate each expense to event
        relateExpensesWithEvent(expenses, eventID, true);

        return res.json({ success: true });
      });
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
});

router.delete("/:eventID", reqAuth, function (req, res) {
  const { eventID } = req.params;

  try {
    Event.findById({ _id: eventID }).then(async (event) => {
      if (!event) {
        return res
          .status(500)
          .json({ success: false, msg: "Evento não encontrado" });
      }
      const token = String(req.headers.authorization);
      const session = await ActiveSession.find({ token: token });
      const user_id = session[0].userId;
      const userLogged = await User.findById(user_id)
        .populate("user_type_id", "permission")
        .select("name");
      if (!userLogged) {
        return res.status(500).json({
          success: false,
          msg: "Erro ao buscar o usuário logado",
        });
      }
      if (!userLogged.user_type_id || !userLogged.user_type_id.permission) {
        return res.status(500).json({
          success: false,
          msg: "Tipo ou permissão do usuário não encontrado",
        });
      }
      // Usuário logado é "Proponente" e o evento não está disponível para ele deletar
      if (
        userLogged.user_type_id.permission === "1" &&
        ["created", "correct", "finished"].indexOf(event.status) === -1
      ) {
        return res.status(500).json({
          success: false,
          msg: "Você não tem permissão para deletar esse evento",
        });
      }

      // Delete event's histories
      await EventHistory.deleteMany({ event_id: eventID });

      // Delete event's dates
      await EventDate.deleteMany({ event_id: eventID });

      // Delete event's lecturers
      await EventLecturer.deleteMany({ event_id: eventID });

      // Delete event's organizers
      await EventOrganizer.deleteMany({ event_id: eventID });

      // Delete event's expense's files
      EventExpense.find({ event_id: eventID }).then((eventExpenses, index) => {
        if (eventExpenses) {
          eventExpenses.forEach((eventExpense) => {
            const expenseFile = eventExpense.file;
            // Delete event's expense's file
            if (expenseFile) {
              const fileWithPath = `${path.resolve(
                __dirname,
                "..",
                "tmp",
                "uploads"
              )}/${expenseFile}`;

              // Verify if file exists
              fs.access(fileWithPath, fs.F_OK, (err) => {
                if (!err) {
                  fs.unlink(fileWithPath, (err) => {});
                }
              });
            }
          });
        }
      });

      // Delete event's expenses
      await EventExpense.deleteMany({ event_id: eventID });

      return event
        .deleteOne()
        .then(() => {
          console.log(`Event ${eventID} deleted!`);
          return res.json({ success: true });
        })
        .catch(() => {
          return res
            .status(500)
            .json({ success: false, msg: "Erro ao deletar o evento" });
        });
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
});

module.exports = router;

function toDateFormatted(
  dateToFormat,
  ymdFormat = false,
  dateWithTime = false
) {
  const date = new Date(dateToFormat).toISOString().replace(/T(\S+)$/, ""); // Replacing the 'T00:00:00.000Z' part of the date
  const dateSplitted = date.split("-");
  if (ymdFormat) {
    return date;
  }
  if (dateWithTime) {
    return `${dateSplitted[2]}/${dateSplitted[1]}/${
      dateSplitted[0]
    } ${transformDateToTime(dateToFormat, true)}`;
  }
  return `${dateSplitted[2]}/${dateSplitted[1]}/${dateSplitted[0]}`;
}

function transformDateToTime(dateToTransform, withSeconds = false) {
  const date = new Date(dateToTransform);
  const hours =
    date.getUTCHours() < 10 ? `0${date.getUTCHours()}` : date.getUTCHours();
  const minutes =
    date.getUTCMinutes() < 10
      ? `0${date.getUTCMinutes()}`
      : date.getUTCMinutes();
  const seconds =
    date.getUTCSeconds() < 10
      ? `0${date.getUTCSeconds()}`
      : date.getUTCSeconds();
  if (withSeconds) {
    return `${hours}:${minutes}:${seconds}`;
  }
  return `${hours}:${minutes}`;
}

function findMinStartDateOnObject(object) {
  return object.reduce(function (a, b) {
    return new Date(a.start_date).getTime() < new Date(b.start_date).getTime()
      ? a
      : b;
  });
}

function findMaxEndDateOnObject(object) {
  return object.reduce(function (a, b) {
    return new Date(a.end_date).getTime() > new Date(b.end_date).getTime()
      ? a
      : b;
  });
}

function endDateIsBiggerAndAnotherDayFromStartDate(startDate, endDate) {
  return (
    new Date(endDate).getTime() > new Date(startDate).getTime() &&
    new Date(endDate).getDay() !== new Date(startDate).getDay()
  );
}

async function validateEventNameUserTypeCategoryAndCoverage({
  event_name,
  event_id,
  user_id,
  event_type_id,
  category_id,
  coverage_id,
}) {
  const eventAlreadyExists = await Event.findOne({ name: event_name });
  if (
    eventAlreadyExists &&
    (!event_id ||
      (event_id && eventAlreadyExists._id.toString() !== event_id.toString()))
  ) {
    return {
      success: false,
      msg: "Evento já existente. Tente informar outro nome.",
    };
  }
  const userExists = await User.findById(user_id);
  if (!userExists) {
    return {
      success: false,
      msg: "Usuário não encontrado",
    };
  }
  const eventTypeExists = await EventType.findById(event_type_id);
  if (!eventTypeExists) {
    return {
      success: false,
      msg: "Tipo do evento não encontrado",
    };
  }
  const eventCategoryExists = await EventCategory.findById(category_id);
  if (!eventCategoryExists) {
    return {
      success: false,
      msg: "Categoria (modalidade) do evento não encontrada",
    };
  }
  const eventCoverageExists = await EventCoverage.findById(coverage_id);
  if (!eventCoverageExists) {
    return {
      success: false,
      msg: "Abrangência do evento não encontrada",
    };
  }
  return {
    success: true,
  };
}

async function addEventHistory(event) {
  const { event_id, dates, lecturers, organizers, expenses } = event;
  const _id = mongoose.Types.ObjectId();
  const newEvent = await EventHistory.create({ event_id, ...event._doc, _id });

  relateDatesWithEvent(dates, newEvent._id);
  relateLecturersWithEvent(lecturers, newEvent._id);
  relateOrganizersWithEvent(organizers, newEvent._id);
  relateExpensesWithEvent(expenses, newEvent._id);
}

function relateDatesWithEvent(dates = [], eventID = null) {
  if (dates && dates.length && eventID) {
    dates.forEach(async (date) => {
      const dateQuery = {
        event_id: eventID,
        start_date: `${new Date(
          `${date.date}T${date.start_time}:00.000Z`
        ).toISOString()}`,
        end_date: `${new Date(
          `${date.date}T${date.end_time}:00.000Z`
        ).toISOString()}`,
        workload: date.workload,
        place: date.place,
        audience_estimate: date.audience_estimate,
        online: date.online,
        link: date.link,
        ticket: date.ticket,
        schedule: date.schedule,
        details: date.details,
        resources: date.resources,
      };

      await EventDate.deleteMany({ event_id: eventID });

      await EventDate.create(dateQuery);
      // .catch((err) => {
      //   return res.status(500).json({
      //     success: false,
      //     msg:
      //       err._message ||
      //       `Erro ao vincular a data "${date.date} ${date.start_time}" até "${date.date} ${date.end_time}" ao evento ${name}`,
      //   });
      // });
    });
  }
}

function relateLecturersWithEvent(lecturers = [], eventID = null) {
  if (lecturers && lecturers.length && eventID) {
    if (lecturers && lecturers.length) {
      lecturers.forEach(async (lecturer) => {
        const { name: lecturerName, office, lattes, email, guest } = lecturer;
        const lecturerAlreadyExists = await Lecturer.findOne({
          name: lecturerName,
        });
        let lecturer_id = null;
        if (lecturerAlreadyExists) {
          lecturer_id = lecturerAlreadyExists._id;
        } else {
          // Create lecturer (if not exists)
          const lecturerQuery = {
            name: lecturerName,
            office,
            lattes,
            email,
            status: "1",
          };
          const newLecturer = await Lecturer.create(lecturerQuery);
          // .catch(
          //   (err) => {
          //     return res.status(500).json({
          //       success: false,
          //       msg:
          //         err._message ||
          //         `Erro ao criar o palestrante/convidado "${lecturerName}"`,
          //     });
          //   }
          // );
          lecturer_id = newLecturer._id;
        }
        const eventLecturerQuery = {
          event_id: eventID,
          lecturer_id,
          type: guest ? "guest" : "lecturer",
        };

        await EventLecturer.deleteMany({ event_id: eventID });

        // Relate lecturer to event
        await EventLecturer.create(eventLecturerQuery);
        // .catch((err) => {
        //   return res.status(500).json({
        //     success: false,
        //     msg:
        //       err._message ||
        //       `Erro ao vincular o palestrante/convidado "${lecturerName}" ao evento ${name}`,
        //   });
        // });
      });
    }
  }
}

function relateOrganizersWithEvent(organizers = [], eventID = null) {
  if (organizers && organizers.length && eventID) {
    if (organizers && organizers.length) {
      organizers.forEach(async (organizer) => {
        const {
          name: organizerName,
          identification,
          office,
          email,
          workload,
        } = organizer;
        const organizerAlreadyExists = await Organizer.findOne({
          name: organizerName,
        });
        let organizer_id = null;
        if (organizerAlreadyExists) {
          organizer_id = organizerAlreadyExists._id;
        } else {
          // Create organizer (if not exists)
          const organizerQuery = {
            name: organizerName,
            identification,
            email,
            status: "1",
          };
          const newOrganizer = await Organizer.create(organizerQuery);
          // .catch(
          //   (err) => {
          //     return res.status(500).json({
          //       success: false,
          //       msg:
          //         err._message ||
          //         `Erro ao criar o organizador/colaborador "${organizerName}"`,
          //     });
          //   }
          // );
          organizer_id = newOrganizer._id;
        }
        const eventOrganizerQuery = {
          event_id: eventID,
          organizer_id,
          office,
          workload,
        };

        await EventOrganizer.deleteMany({ event_id: eventID });

        // Relate organizer to event
        await EventOrganizer.create(eventOrganizerQuery);
        // .catch((err) => {
        //   return res.status(500).json({
        //     success: false,
        //     msg:
        //       err._message ||
        //       `Erro ao vincular o organizador/colaborador "${organizerName}" ao evento ${name}`,
        //   });
        // });
      });
    }
  }
}

async function relateExpensesWithEvent(
  expenses = [],
  eventID = null,
  createFile = false
) {
  if (expenses && expenses.length && eventID) {
    const expensesFilesToDelete = [];
    const expensesFilesSetted = [];

    // Get all event's expense's files in request
    expenses.filter((expense) => {
      if (expense.file && expense.file_uploaded) {
        expensesFilesSetted.push(expense.file);
      }
    });

    // Get all event's expense's files already in database
    await EventExpense.find({ event_id: eventID }).then((eventExpenses) => {
      if (eventExpenses) {
        eventExpenses.forEach((eventExpense) => {
          const expenseFile = eventExpense.filename;
          if (expenseFile && !expensesFilesSetted.includes(eventExpense.file)) {
            // Add expense's file removed to deleteArray
            expensesFilesToDelete.push({ [eventExpense.id]: expenseFile });
          }
        });
      }
    });

    if (expenses && expenses.length) {
      await Promise.all(
        expenses.map(async (expense, index) => {
          const {
            event_expense_type_id: { _id: event_expense_type_id },
            provider,
            amount,
            is_new: isNewExpense,
            file,
            filename,
            file_uploaded,
            file_base64,
            comments,
          } = expense;

          const eventExpenseTypeExists = await EventExpenseType.findById(
            event_expense_type_id
          );
          if (eventExpenseTypeExists) {
            const eventExpenseQuery = {
              event_id: eventID,
              event_expense_type_id,
              provider,
              amount,
              file,
              filename,
              comments,
            };

            // expensesFilesToDelete = expensesFilesToDelete.filter(function (
            //   expenseFileToDelete
            // ) {
            //   const expenseFileIndex = Object.keys(expenseFileToDelete);
            //   if (expenseFileIndex && expenseFileIndex[0]) {
            //     const firstExpenseFileIndex = expenseFileIndex[0];
            //     if (
            //       expenseFileToDelete[firstExpenseFileIndex] &&
            //       expenseFileToDelete[firstExpenseFileIndex] === filename
            //     ) {
            //       return false;
            //     }
            //   }
            //   return true;
            // });

            if (isNewExpense) {
              await EventExpense.create(eventExpenseQuery);
            } else if (createFile && !file_uploaded && file) {
              crypto.randomBytes(16, (err, hash) => {
                if (!err) {
                  const fileSplitted = file.split(".");
                  const fileExtension = fileSplitted.pop();
                  const fileNameStarted = slugify(fileSplitted.join("."));
                  const fileName = `${hash.toString(
                    "hex"
                  )}-${fileNameStarted}.${fileExtension}`;
                  eventExpenseQuery.file;
                  eventExpenseQuery.filename = fileName;
                  fs.writeFile(
                    `${path.resolve(
                      __dirname,
                      "..",
                      "tmp",
                      "uploads"
                    )}/${fileName}`,
                    file_base64,
                    "base64",
                    async (err, data) => {
                      if (err) {
                        return res.status(500).json({
                          success: false,
                          msg:
                            err._message ||
                            `Erro ao fazer upload do arquivo da despesa #${
                              index + 1
                            }`,
                        });
                      }
                      await EventExpense.create(eventExpenseQuery);
                    }
                  );
                }
              });
            }

            // Relate Expense to event
            // await EventExpense.create(eventExpenseQuery);
            // .catch((err) => {
            //   return res.status(500).json({
            //     success: false,
            //     msg:
            //       err._message ||
            //       `Erro ao vincular a despesa "${provider}" ao evento ${name}`,
            //   });
            // });
          }
        })
      );
    }

    if (expensesFilesToDelete.length) {
      for (let f = 0; f < expensesFilesToDelete.length; f++) {
        const expenseFileIndex = Object.keys(expensesFilesToDelete[f]);
        if (expenseFileIndex && expenseFileIndex[0]) {
          const firstExpenseFileIndex = expenseFileIndex[0];
          const fileToDelete = expensesFilesToDelete[f][firstExpenseFileIndex];
          if (fileToDelete) {
            const fileWithPath = `${path.resolve(
              __dirname,
              "..",
              "tmp",
              "uploads"
            )}/${fileToDelete}`;

            // Verify if file exists
            fs.access(fileWithPath, fs.F_OK, async (err) => {
              if (!err) {
                fs.unlink(fileWithPath, async (err) => {
                  if (!err) {
                    await EventExpense.findByIdAndDelete(firstExpenseFileIndex);
                  }
                });
              } else {
                await EventExpense.findByIdAndDelete(firstExpenseFileIndex);
              }
            });
          }
        }
      }
    }
  }
}

function formatAmount(amount) {
  if (amount && !isNaN(amount)) {
    return `R$ ${parseFloat(amount).toFixed(2).replace(".", ",")}`;
  }
  return null;
}

function slugify(str) {
  str = str.replace(/^\s+|\s+$/g, "");

  // Make the string lowercase
  str = str.toLowerCase();

  // Remove accents, swap ñ for n, etc
  var from =
    "ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;";
  var to =
    "AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------";
  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
  }

  // Remove invalid chars
  str = str
    .replace(/[^a-z0-9 -]/g, "")
    // Collapse whitespace and replace by -
    .replace(/\s+/g, "-")
    // Collapse dashes
    .replace(/-+/g, "-");

  return str;
}
