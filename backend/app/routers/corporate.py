from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel

from ..database import get_db
from ..models import User, CorporateEmployee, EmployeeDocument, Attendance, CorporateProject, ProjectTask
from .auth import get_current_user

router = APIRouter(prefix="/corporate", tags=["Corporate"])

# --- Pydantic Schemas ---

class EmployeeCreate(BaseModel):
    full_name: str
    dob: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    joining_date: Optional[date] = None
    employment_type: str = "Permanent"
    basic_salary: Optional[float] = None
    allowances: Optional[dict] = {}

class AttendanceCreate(BaseModel):
    employee_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: str = "Present"

class ProjectCreate(BaseModel):
    project_name: str
    project_code: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    team_members: Optional[list] = []

class TaskCreate(BaseModel):
    project_id: int
    task_name: str
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    priority: str = "medium"
    due_date: Optional[date] = None

# --- Endpoints ---

@router.post("/employees")
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register new employee"""
    # Generate employee code
    count = db.query(CorporateEmployee).filter(
        CorporateEmployee.company_id == current_user.hospital_id
    ).count()
    employee_code = f"EMP{current_user.hospital_id:04d}{count+1:06d}"
    
    new_employee = CorporateEmployee(
        company_id=current_user.hospital_id,
        employee_code=employee_code,
        full_name=employee.full_name,
        dob=employee.dob,
        gender=employee.gender,
        phone=employee.phone,
        email=employee.email,
        address=employee.address,
        designation=employee.designation,
        department=employee.department,
        joining_date=employee.joining_date or date.today(),
        employment_type=employee.employment_type,
        basic_salary=employee.basic_salary,
        allowances=employee.allowances
    )
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    return new_employee

@router.get("/employees")
def get_employees(
    department: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all employees"""
    query = db.query(CorporateEmployee).filter(
        CorporateEmployee.company_id == current_user.hospital_id,
        CorporateEmployee.is_active == is_active
    )
    
    if department:
        query = query.filter(CorporateEmployee.department == department)
    
    return query.all()

@router.get("/employees/{employee_id}")
def get_employee_detail(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get employee details"""
    employee = db.query(CorporateEmployee).filter(
        CorporateEmployee.employee_id == employee_id,
        CorporateEmployee.company_id == current_user.hospital_id
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    documents = db.query(EmployeeDocument).filter(
        EmployeeDocument.employee_id == employee_id
    ).all()
    
    return {
        "employee": employee,
        "documents": documents
    }

@router.post("/attendance")
def mark_attendance(
    attendance: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark employee attendance"""
    # Check if already marked
    existing = db.query(Attendance).filter(
        Attendance.employee_id == attendance.employee_id,
        Attendance.date == attendance.date
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already marked for this date")
    
    work_hours = 0
    if attendance.check_in and attendance.check_out:
        delta = attendance.check_out - attendance.check_in
        work_hours = delta.total_seconds() / 3600
    
    new_attendance = Attendance(
        employee_id=attendance.employee_id,
        date=attendance.date,
        check_in=attendance.check_in,
        check_out=attendance.check_out,
        status=attendance.status,
        work_hours=work_hours
    )
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    return new_attendance

@router.get("/attendance/{employee_id}")
def get_employee_attendance(
    employee_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get attendance records for employee"""
    query = db.query(Attendance).filter(Attendance.employee_id == employee_id)
    
    if month and year:
        query = query.filter(
            func.extract('month', Attendance.date) == month,
            func.extract('year', Attendance.date) == year
        )
    
    return query.order_by(Attendance.date.desc()).all()

@router.post("/projects")
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new project"""
    # Generate project code if not provided
    if not project.project_code:
        count = db.query(CorporateProject).filter(
            CorporateProject.company_id == current_user.hospital_id
        ).count()
        project.project_code = f"PRJ{current_user.hospital_id:04d}{count+1:04d}"
    
    new_project = CorporateProject(
        company_id=current_user.hospital_id,
        project_name=project.project_name,
        project_code=project.project_code,
        description=project.description,
        start_date=project.start_date,
        end_date=project.end_date,
        status="Planning",
        budget=project.budget,
        team_members=project.team_members
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.get("/projects")
def get_projects(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all projects"""
    query = db.query(CorporateProject).filter(
        CorporateProject.company_id == current_user.hospital_id
    )
    
    if status:
        query = query.filter(CorporateProject.status == status)
    
    return query.all()

@router.post("/tasks")
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create project task"""
    new_task = ProjectTask(
        project_id=task.project_id,
        task_name=task.task_name,
        description=task.description,
        assigned_to=task.assigned_to,
        priority=task.priority,
        status="todo",
        due_date=task.due_date
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.get("/tasks/{project_id}")
def get_project_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tasks for a project"""
    tasks = db.query(ProjectTask).filter(
        ProjectTask.project_id == project_id
    ).all()
    
    result = []
    for t in tasks:
        assignee = None
        if t.assigned_to:
            emp = db.query(CorporateEmployee).filter(
                CorporateEmployee.employee_id == t.assigned_to
            ).first()
            assignee = emp.full_name if emp else None
        
        result.append({
            "task_id": t.task_id,
            "task_name": t.task_name,
            "description": t.description,
            "assigned_to": t.assigned_to,
            "assignee_name": assignee,
            "priority": t.priority,
            "status": t.status,
            "due_date": t.due_date
        })
    
    return result

@router.patch("/tasks/{task_id}/status")
def update_task_status(
    task_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update task status"""
    task = db.query(ProjectTask).filter(ProjectTask.task_id == task_id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = status
    if status == "done":
        task.completed_date = date.today()
    
    db.commit()
    db.refresh(task)
    return task

@router.get("/stats")
def get_corporate_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get corporate statistics"""
    total_employees = db.query(CorporateEmployee).filter(
        CorporateEmployee.company_id == current_user.hospital_id,
        CorporateEmployee.is_active == True
    ).count()
    
    total_projects = db.query(CorporateProject).filter(
        CorporateProject.company_id == current_user.hospital_id
    ).count()
    
    active_projects = db.query(CorporateProject).filter(
        CorporateProject.company_id == current_user.hospital_id,
        CorporateProject.status == "Active"
    ).count()
    
    today_attendance = db.query(Attendance).join(CorporateEmployee).filter(
        CorporateEmployee.company_id == current_user.hospital_id,
        Attendance.date == date.today(),
        Attendance.status == "Present"
    ).count()
    
    return {
        "total_employees": total_employees,
        "total_projects": total_projects,
        "active_projects": active_projects,
        "today_attendance": today_attendance
    }
