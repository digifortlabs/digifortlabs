from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from pydantic import BaseModel
from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        return db.query(self.model).get(id)

    def get_first(self, db: Session, *args, **kwargs) -> Optional[ModelType]:
        query = db.query(self.model)
        if args:
            query = query.filter(*args)
        if kwargs:
            for k, v in kwargs.items():
                query = query.filter(getattr(self.model, k) == v)
        return query.first()

    def get_multi(self, db: Session, *args, skip: int = 0, limit: int = 100, **kwargs) -> List[ModelType]:
        query = db.query(self.model)
        if args:
            query = query.filter(*args)
        if kwargs:
            for k, v in kwargs.items():
                query = query.filter(getattr(self.model, k) == v)
        return query.offset(skip).limit(limit).all()

    def count(self, db: Session, *args, **kwargs) -> int:
        query = db.query(self.model)
        if args:
            query = query.filter(*args)
        if kwargs:
            for k, v in kwargs.items():
                query = query.filter(getattr(self.model, k) == v)
        return query.count()

    def create(self, db: Session, *, obj_in: Union[CreateSchemaType, Dict[str, Any]]) -> ModelType:
        obj_in_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump()
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: ModelType, obj_in: Union[UpdateSchemaType, Dict[str, Any]]) -> ModelType:
        obj_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump(exclude_unset=True)
        for field, value in obj_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int) -> ModelType:
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj
